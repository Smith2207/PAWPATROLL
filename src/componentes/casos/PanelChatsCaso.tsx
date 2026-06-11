"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { gestionarEstadoAvistamiento } from "@/actions/avistamientos";
import {
  listarMensajesChatAvistamiento,
  reportarComportamientoSospechoso,
  sincronizarResumenChatsMascota,
  type ResumenChatAvistamiento,
} from "@/actions/casos";
import { ChatPrivadoCaso } from "@/componentes/casos/ChatPrivadoCaso";
import { EtiquetaRolParticipante } from "@/componentes/casos/EtiquetaRolParticipante";
import { Icono, iconoPorTipoMascota } from "@/componentes/ui/Icono";
import { resolverConversacionAvistamiento } from "@/lib/chat/conversacion";
import { previewMensajeChat } from "@/lib/chat/mensaje";
import { rolParticipante } from "@/lib/chat/roles";
import { horaRelativaChat } from "@/lib/chat/tiempo";
import { mapEventosParaAvistamiento, type EventoCasoTimeline } from "@/lib/chat/timeline";
import type { Avistamiento, EventoCaso, MensajeAvistamiento, Mascota } from "@/lib/db/schema";
import { useTiempoRealConRespaldo } from "@/hooks/useTiempoRealConRespaldo";

export type MascotaCaso = Mascota & { fotoPrincipal: string | null };

export type AvistamientoCaso = Avistamiento & {
  mensajes: MensajeAvistamiento[];
  eventos: EventoCaso[];
  duenoUserId: string;
  duenoNombre: string;
  duenoImagen: string | null;
  reportanteUserId: string | null;
  reportanteNombre: string;
  reportanteImagen: string | null;
  noLeidos?: number;
  ultimoLeidoInterlocutorAt?: Date | null;
};

type Props = {
  mascota: MascotaCaso;
  avistamientos: AvistamientoCaso[];
  miUserId: string;
  onAbrirContexto?: () => void;
};

function ultimaActividad(av: AvistamientoCaso) {
  const ultimo = av.mensajes.at(-1);
  return ultimo
    ? new Date(ultimo.createdAt).getTime()
    : new Date(av.createdAt).getTime();
}

function previewLista(av: AvistamientoCaso) {
  const ultimo = av.mensajes.at(-1);
  if (ultimo) {
    const t = previewMensajeChat(ultimo);
    return t.length > 42 ? `"${t.slice(0, 41)}…"` : `"${t}"`;
  }
  return "Sin mensajes aún";
}

function mapEventos(eventos: EventoCaso[], av: Avistamiento): EventoCasoTimeline[] {
  return mapEventosParaAvistamiento(eventos, {
    id: av.id,
    lat: av.lat,
    lng: av.lng,
    direccion: av.direccion,
    enTiempoReal: av.enTiempoReal,
  });
}

function mensajesPreviewDesdeResumen(
  avistamientoId: string,
  resumen: ResumenChatAvistamiento
): MensajeAvistamiento[] {
  if (!resumen.ultimoActividad) return [];
  return [
    {
      id: `preview-${avistamientoId}`,
      avistamientoId,
      userId: null,
      autorNombre: null,
      contenido: resumen.ultimoContenido ?? "",
      adjuntoUrl: resumen.ultimoAdjuntoUrl,
      createdAt: resumen.ultimoActividad,
    },
  ];
}

export function PanelChatsCaso({
  mascota,
  avistamientos: avistamientosIniciales,
  miUserId,
  onAbrirContexto,
}: Props) {
  const router = useRouter();
  const [lista, setLista] = useState(avistamientosIniciales);
  const [pendiente, iniciar] = useTransition();
  const iconoMascota = iconoPorTipoMascota(mascota.tipo);

  const ordenados = useMemo(
    () => [...lista].sort((a, b) => ultimaActividad(b) - ultimaActividad(a)),
    [lista]
  );

  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(
    () => ordenados[0]?.id ?? null
  );
  const [vistaMovil, setVistaMovil] = useState<"lista" | "chat">("lista");
  const [reporteAbierto, setReporteAbierto] = useState(false);
  const [motivoReporte, setMotivoReporte] = useState("");
  const [errorReporte, setErrorReporte] = useState<string | null>(null);
  const [errorGestion, setErrorGestion] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => setLista(avistamientosIniciales));
  }, [avistamientosIniciales]);

  const sincronizarPanel = useCallback(
    async (avistamientoIdEvento?: string) => {
      const idActivo = avistamientoIdEvento ?? seleccionadoId;
      const [resumen, chatActivo] = await Promise.all([
        sincronizarResumenChatsMascota(mascota.id),
        idActivo
          ? listarMensajesChatAvistamiento(idActivo)
          : Promise.resolve(null),
      ]);
      if (!resumen) return;

      setLista((prev) =>
        prev.map((av) => {
          const r = resumen.find((x) => x.avistamientoId === av.id);
          if (!r) return av;
          const esActivo = av.id === idActivo;
          return {
            ...av,
            mensajes:
              esActivo && chatActivo
                ? chatActivo.mensajes
                : mensajesPreviewDesdeResumen(av.id, r),
            noLeidos: r.noLeidos,
            ultimoLeidoInterlocutorAt:
              esActivo && chatActivo
                ? chatActivo.ultimoLeidoInterlocutorAt
                : r.ultimoLeidoInterlocutorAt,
          };
        })
      );
    },
    [mascota.id, seleccionadoId]
  );

  useTiempoRealConRespaldo(
    [`mascota:${mascota.id}`],
    (ev) => {
      if (
        ev.tipo === "mensaje:nuevo" &&
        "mascotaId" in ev &&
        ev.mascotaId === mascota.id
      ) {
        void sincronizarPanel(ev.avistamientoId);
        return;
      }
      if (ev.tipo === "chat:leido") {
        void sincronizarPanel(ev.avistamientoId);
        return;
      }
      if (
        ev.tipo === "caso:actualizado" ||
        ev.tipo === "avistamiento:actualizado"
      ) {
        if (
          ev.tipo === "caso:actualizado" &&
          ev.mascotaId !== mascota.id
        ) {
          return;
        }
        void sincronizarPanel();
      }
    },
    () => {
      void sincronizarPanel();
    },
    12_000
  );

  useEffect(() => {
    if (!seleccionadoId && ordenados[0]) {
      queueMicrotask(() => setSeleccionadoId(ordenados[0]!.id));
    }
  }, [ordenados, seleccionadoId]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const abrirChatUnico = () => {
      if (mq.matches && ordenados.length === 1 && ordenados[0]) {
        setSeleccionadoId(ordenados[0].id);
        setVistaMovil("chat");
      }
    };
    abrirChatUnico();
    mq.addEventListener("change", abrirChatUnico);
    return () => mq.removeEventListener("change", abrirChatUnico);
  }, [ordenados]);

  const activo = ordenados.find((a) => a.id === seleccionadoId) ?? null;

  const convActiva = useMemo(() => {
    if (!activo) return null;
    return resolverConversacionAvistamiento(miUserId, {
      duenoUserId: activo.duenoUserId,
      duenoNombre: activo.duenoNombre,
      duenoImagen: activo.duenoImagen,
      reportanteUserId: activo.reportanteUserId,
      reportanteNombre: activo.reportanteNombre,
      reportanteImagen: activo.reportanteImagen,
      nombreMascota: mascota.nombre,
      tipoMascota: mascota.tipo,
    });
  }, [activo, miUserId, mascota.nombre, mascota.tipo]);

  const rolOtro = convActiva
    ? rolParticipante(convActiva.otro.userId, activo!.duenoUserId)
    : null;

  function seleccionar(id: string) {
    setSeleccionadoId(id);
    setVistaMovil("chat");
    setReporteAbierto(false);
    setMotivoReporte("");
    setErrorReporte(null);
  }

  function enviarReporte() {
    if (!activo) return;
    iniciar(async () => {
      setErrorReporte(null);
      const res = await reportarComportamientoSospechoso(activo.id, motivoReporte);
      if (!res.ok) {
        setErrorReporte(res.error ?? "No se pudo reportar.");
        return;
      }
      setReporteAbierto(false);
      setMotivoReporte("");
    });
  }

  function gestionar(id: string, estado: "VERIFICADO" | "DESCARTADO") {
    iniciar(async () => {
      setErrorGestion(null);
      const res = await gestionarEstadoAvistamiento(id, estado);
      if (res.ok) router.refresh();
      else setErrorGestion(res.error ?? "No se pudo actualizar el avistamiento.");
    });
  }

  if (ordenados.length === 0) {
    return (
      <p className="pp-coord-vacio">
        Cuando alguien reporte un avistamiento, aparecerá aquí como caso activo.
      </p>
    );
  }

  return (
    <div
      className={`pp-coord-chat-grid${vistaMovil === "chat" ? " pp-coord-chat-grid--chat-activo" : ""}`}
    >
      <aside className="pp-coord-lista" aria-label="Casos activos">
        <div className="pp-coord-lista-cabecera">
          <strong>Casos activos</strong>
          <span>{ordenados.length}</span>
        </div>
        <ul className="pp-coord-lista-items">
          {ordenados.map((av) => {
            const activa = av.id === seleccionadoId;
            const fechaRef = av.mensajes.at(-1)?.createdAt ?? av.createdAt;
            const conv = resolverConversacionAvistamiento(miUserId, {
              duenoUserId: av.duenoUserId,
              duenoNombre: av.duenoNombre,
              duenoImagen: av.duenoImagen,
              reportanteUserId: av.reportanteUserId,
              reportanteNombre: av.reportanteNombre,
              reportanteImagen: av.reportanteImagen,
              nombreMascota: mascota.nombre,
              tipoMascota: mascota.tipo,
            });
            return (
              <li key={av.id}>
                <button
                  type="button"
                  className={`pp-coord-lista-fila${activa ? " pp-coord-lista-fila--activa" : ""}`}
                  onClick={() => seleccionar(av.id)}
                  aria-current={activa ? "true" : undefined}
                >
                  <span className="pp-coord-lista-foto">
                    {mascota.fotoPrincipal ? (
                      <img src={mascota.fotoPrincipal} alt="" width={44} height={44} />
                    ) : (
                      <span className="pp-coord-lista-foto-emoji" aria-hidden>
                        <Icono nombre={iconoMascota} size={20} />
                      </span>
                    )}
                  </span>
                  <span className="pp-coord-lista-texto">
                    <span className="pp-coord-lista-top">
                      <strong className="pp-coord-lista-nombre-mascota">
                        <Icono nombre={iconoMascota} size={14} className="pp-coord-lista-nombre-icono" />
                        {mascota.nombre}
                      </strong>
                      <span className="pp-coord-lista-top-meta">
                        {(av.noLeidos ?? 0) > 0 && (
                          <span
                            className="pp-coord-lista-no-leidos"
                            aria-label={`${av.noLeidos} sin leer`}
                          >
                            {av.noLeidos! > 9 ? "9+" : av.noLeidos}
                          </span>
                        )}
                        <time>{horaRelativaChat(fechaRef)}</time>
                      </span>
                    </span>
                    <span className="pp-coord-lista-participante">
                      {conv.otro.nombre}
                    </span>
                    <span className="pp-coord-lista-preview">{previewLista(av)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="pp-coord-conversacion">
        {!activo || !convActiva ? (
          <div className="pp-coord-conversacion-vacio">
            Elige un caso activo de la lista
          </div>
        ) : (
          <>
            <header className="pp-coord-chat-header">
              <button
                type="button"
                className="pp-coord-chat-volver"
                onClick={() => setVistaMovil("lista")}
                aria-label="Volver a casos activos"
              >
                <Icono nombre="izquierda" size={18} />
              </button>

              <div className="pp-coord-chat-header-principal">
                {convActiva.otro.imagen ? (
                  <img
                    src={convActiva.otro.imagen}
                    alt=""
                    className="pp-coord-chat-header-avatar"
                    width={32}
                    height={32}
                  />
                ) : (
                  <span className="pp-coord-chat-header-iniciales" aria-hidden>
                    {convActiva.otro.nombre.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div>
                  <strong>{convActiva.otro.nombre}</strong>
                  {rolOtro && <EtiquetaRolParticipante rol={rolOtro} />}
                </div>
              </div>

              <div className="pp-coord-chat-header-acciones">
                {onAbrirContexto && (
                  <button
                    type="button"
                    className="pp-coord-chat-icono"
                    onClick={onAbrirContexto}
                    aria-label="Contexto del caso"
                  >
                    <Icono nombre="info" size={16} />
                  </button>
                )}
                {activo.estado === "PENDIENTE" && (
                  <>
                    <button
                      type="button"
                      className="pp-coord-chat-icono pp-coord-chat-icono--ok"
                      disabled={pendiente}
                      onClick={() => gestionar(activo.id, "VERIFICADO")}
                      aria-label="Verificar avistamiento"
                      title="Verificar"
                    >
                      <Icono nombre="check" size={16} />
                    </button>
                    <button
                      type="button"
                      className="pp-coord-chat-icono"
                      disabled={pendiente}
                      onClick={() => gestionar(activo.id, "DESCARTADO")}
                      aria-label="Descartar avistamiento"
                      title="Descartar"
                    >
                      <Icono nombre="cerrar" size={16} />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="pp-coord-chat-icono"
                  onClick={() => setReporteAbierto((v) => !v)}
                  aria-label="Reportar"
                  title="Reportar"
                >
                  <Icono nombre="alerta" size={16} />
                </button>
              </div>
            </header>

            {errorGestion && (
              <p className="auth-alerta auth-alerta--error pp-coord-error-gestion" role="alert">
                {errorGestion}
              </p>
            )}

            {reporteAbierto && (
              <div className="pp-chat-reporte-panel pp-chat-reporte-panel--compacto">
                <textarea
                  rows={2}
                  value={motivoReporte}
                  onChange={(e) => setMotivoReporte(e.target.value)}
                  placeholder="Describe el problema…"
                  aria-label="Motivo del reporte"
                />
                {errorReporte && (
                  <p className="auth-alerta auth-alerta--error" role="alert">
                    {errorReporte}
                  </p>
                )}
                <button
                  type="button"
                  className="pp-coord-btn pp-coord-btn--primario"
                  disabled={pendiente}
                  onClick={enviarReporte}
                >
                  Enviar reporte
                </button>
              </div>
            )}

            <ChatPrivadoCaso
              key={activo.id}
              avistamientoId={activo.id}
              mascotaId={mascota.id}
              numeroReporte={activo.numeroReporte}
              mensajesIniciales={activo.mensajes}
              eventosIniciales={mapEventos(activo.eventos, activo)}
              nombreMascota={mascota.nombre}
              tipoMascota={mascota.tipo}
              miUserId={miUserId}
              ultimoLeidoInterlocutorAt={activo.ultimoLeidoInterlocutorAt}
              embed
              ocultarReporte
            />
          </>
        )}
      </div>
    </div>
  );
}
