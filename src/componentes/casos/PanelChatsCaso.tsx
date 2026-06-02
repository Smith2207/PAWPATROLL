"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { gestionarEstadoAvistamiento } from "@/actions/avistamientos";
import { reportarComportamientoSospechoso } from "@/actions/casos";
import { ChatPrivadoCaso } from "@/componentes/casos/ChatPrivadoCaso";
import { Icono } from "@/componentes/ui/Icono";
import type { Avistamiento, MensajeAvistamiento, Mascota } from "@/lib/db/schema";

export type AvistamientoCaso = Avistamiento & {
  mensajes: MensajeAvistamiento[];
  reportanteNombre: string;
  reportanteImagen: string | null;
};

type Props = {
  mascota: Mascota;
  avistamientos: AvistamientoCaso[];
};

function iniciales(nombre: string) {
  return (
    nombre
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function ultimaActividad(av: AvistamientoCaso) {
  const ultimo = av.mensajes.at(-1);
  return ultimo
    ? new Date(ultimo.createdAt).getTime()
    : new Date(av.createdAt).getTime();
}

function previewChat(av: AvistamientoCaso) {
  const ultimo = av.mensajes.at(-1);
  if (ultimo) return ultimo.contenido;
  if (av.direccion) return av.direccion;
  return "Sin mensajes — toca para chatear";
}

function etiquetaEstado(estado: Avistamiento["estado"]) {
  if (estado === "VERIFICADO") return "Verificado";
  if (estado === "DESCARTADO") return "Descartado";
  return "Pendiente";
}

function truncar(texto: string, max = 72) {
  const limpio = texto.trim();
  if (limpio.length <= max) return limpio;
  return `${limpio.slice(0, max - 1)}…`;
}

function AvatarReportante({
  nombre,
  imagen,
}: {
  nombre: string;
  imagen: string | null;
}) {
  if (imagen) {
    return (
      <img
        src={imagen}
        alt=""
        className="pp-caso-chat-avatar-img"
        width={48}
        height={48}
      />
    );
  }
  return (
    <span className="pp-caso-chat-avatar-iniciales" aria-hidden>
      {iniciales(nombre)}
    </span>
  );
}

export function PanelChatsCaso({ mascota, avistamientos: avistamientosIniciales }: Props) {
  const router = useRouter();
  const [lista, setLista] = useState(avistamientosIniciales);
  const [pendiente, iniciar] = useTransition();

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

  useEffect(() => {
    setLista(avistamientosIniciales);
  }, [avistamientosIniciales]);

  useEffect(() => {
    if (!seleccionadoId && ordenados[0]) {
      setSeleccionadoId(ordenados[0].id);
    }
  }, [ordenados, seleccionadoId]);

  const activo = ordenados.find((a) => a.id === seleccionadoId) ?? null;

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
      const res = await reportarComportamientoSospechoso(
        activo.id,
        motivoReporte
      );
      if (!res.ok) {
        setErrorReporte(res.error ?? "No se pudo reportar.");
        return;
      }
      setReporteAbierto(false);
      setMotivoReporte("");
    });
  }

  function gestionar(id: string, estado: "VERIFICADO" | "DESCARTADO") {
    const motivo =
      estado === "DESCARTADO"
        ? window.prompt("Motivo del descarte (opcional)") ?? undefined
        : undefined;
    iniciar(async () => {
      const res = await gestionarEstadoAvistamiento(id, estado, motivo);
      if (res.ok) router.refresh();
      else alert(res.error ?? "Error");
    });
  }

  if (ordenados.length === 0) {
    return (
      <p className="pp-caso-timeline-vacio">
        Cuando alguien reporte un avistamiento, aparecerá aquí con su chat
        privado.
      </p>
    );
  }

  return (
    <div
      className={`pp-caso-whatsapp${vistaMovil === "chat" ? " pp-caso-whatsapp--chat-activo" : ""}`}
    >
      <aside className="pp-caso-chat-lista" aria-label="Conversaciones">
        <div className="pp-caso-chat-lista-cabecera">
          <strong>Conversaciones</strong>
          <span>{ordenados.length}</span>
        </div>
        <ul className="pp-caso-chat-lista-items">
          {ordenados.map((av) => {
            const activa = av.id === seleccionadoId;
            const fechaRef = av.mensajes.at(-1)?.createdAt ?? av.createdAt;
            return (
              <li key={av.id}>
                <button
                  type="button"
                  className={`pp-caso-chat-fila${activa ? " pp-caso-chat-fila--activa" : ""}`}
                  onClick={() => seleccionar(av.id)}
                  aria-current={activa ? "true" : undefined}
                >
                  <span className="pp-caso-chat-avatar">
                    <AvatarReportante
                      nombre={av.reportanteNombre}
                      imagen={av.reportanteImagen}
                    />
                    {av.estado === "PENDIENTE" && (
                      <span className="pp-caso-chat-avatar-alerta" aria-hidden />
                    )}
                  </span>
                  <span className="pp-caso-chat-fila-texto">
                    <span className="pp-caso-chat-fila-top">
                      <strong>
                        Avistamiento #{av.numeroReporte}
                      </strong>
                      <time>
                        {new Date(fechaRef).toLocaleString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </span>
                    <span className="pp-caso-chat-fila-reportante">
                      {av.reportanteNombre}
                    </span>
                    <span className="pp-caso-chat-fila-preview">
                      {previewChat(av)}
                    </span>
                  </span>
                  <span
                    className={`pp-caso-avist-estado pp-caso-avist-estado--${av.estado.toLowerCase()}`}
                  >
                    {etiquetaEstado(av.estado)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="pp-caso-chat-detalle">
        {!activo ? (
          <div className="pp-caso-chat-vacio">
            Elige una conversación de la lista
          </div>
        ) : (
          <>
            <header className="pp-caso-chat-detalle-header">
              <button
                type="button"
                className="pp-caso-chat-volver pp-enlace-icono"
                onClick={() => setVistaMovil("lista")}
                aria-label="Volver a conversaciones"
              >
                <Icono nombre="izquierda" size={18} />
              </button>

              <div className="pp-caso-chat-detalle-principal">
                <span className="pp-caso-chat-detalle-avatar">
                  <AvatarReportante
                    nombre={activo.reportanteNombre}
                    imagen={activo.reportanteImagen}
                  />
                </span>
                <div className="pp-caso-chat-detalle-info">
                  <strong>
                    Avistamiento #{activo.numeroReporte} ·{" "}
                    {activo.reportanteNombre}
                  </strong>
                  <span className="pp-caso-chat-detalle-meta">
                    Reportó sobre {mascota.nombre}
                    {activo.direccion
                      ? ` · ${truncar(activo.direccion)}`
                      : ""}
                  </span>
                  <time>
                    {new Date(activo.createdAt).toLocaleString("es-PE", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </div>
              </div>

              <div className="pp-caso-chat-detalle-top">
                <span
                  className={`pp-caso-avist-estado pp-caso-avist-estado--${activo.estado.toLowerCase()}`}
                >
                  {etiquetaEstado(activo.estado)}
                </span>
                <button
                  type="button"
                  className="pp-caso-btn-reportar"
                  onClick={() => setReporteAbierto((v) => !v)}
                  aria-label="Reportar conversación"
                  title="Reportar conversación"
                >
                  <Icono nombre="alerta" size={16} />
                </button>
              </div>

              {activo.estado === "PENDIENTE" && (
                <div className="pp-caso-chat-detalle-gestion">
                  <button
                    type="button"
                    className="pp-caso-btn-verificar"
                    disabled={pendiente}
                    onClick={() => gestionar(activo.id, "VERIFICADO")}
                  >
                    <Icono nombre="check" size={14} />
                    Verificar
                  </button>
                  <button
                    type="button"
                    className="pp-caso-btn-descartar"
                    disabled={pendiente}
                    onClick={() => gestionar(activo.id, "DESCARTADO")}
                  >
                    Descartar
                  </button>
                </div>
              )}
            </header>

            {reporteAbierto && (
              <div className="pp-chat-reporte-panel">
                <label htmlFor={`reporte-caso-${activo.id}`}>
                  Comportamiento sospechoso o contenido inapropiado
                </label>
                <textarea
                  id={`reporte-caso-${activo.id}`}
                  rows={3}
                  value={motivoReporte}
                  onChange={(e) => setMotivoReporte(e.target.value)}
                  placeholder="Describe qué ocurrió…"
                />
                {errorReporte && (
                  <p className="auth-alerta auth-alerta--error" role="alert">
                    {errorReporte}
                  </p>
                )}
                <button
                  type="button"
                  className="pp-caso-btn-reporte-enviar"
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
              esDueno
              nombreMascota={mascota.nombre}
              nombreReportante={activo.reportanteNombre}
              embed
              ocultarReporte
            />
          </>
        )}
      </div>
    </div>
  );
}
