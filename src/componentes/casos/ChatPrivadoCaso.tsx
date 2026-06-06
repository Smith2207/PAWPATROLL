"use client";

import { useEffect, useMemo, useRef, useState, useTransition, useCallback } from "react";
import { enviarMensajeAvistamiento } from "@/actions/avistamientos";
import { marcarChatLeido, listarMensajesChatAvistamiento, reportarComportamientoSospechoso } from "@/actions/casos";
import type { MensajeAvistamiento } from "@/lib/db/schema";
import {
  esContenidoFotoPlaceholder,
  esMensajePropio,
  ETIQUETA_MENSAJE_FOTO,
  etiquetaFechaChat,
  formatearHoraMensaje,
  mostrarSeparadorFecha,
  urlParaMostrarAdjunto,
} from "@/lib/chat/mensaje";
import { BurbujaUbicacionChat } from "@/componentes/casos/BurbujaUbicacionChat";
import { useGeolocalizacion } from "@/hooks/useGeolocalizacion";
import { useSolicitudUbicacion } from "@/hooks/useSolicitudUbicacion";
import { ETIQUETA_GPS, pareceCoordenadas } from "@/lib/geo/etiqueta-ubicacion";
import type { UbicacionSeleccionada } from "@/lib/geo/tipos";
import {
  parsearUbicacionMensaje,
  serializarUbicacionChat,
  type UbicacionChat,
} from "@/lib/chat/ubicacion-mensaje";
import { VisorLightboxFotos } from "@/componentes/mascotas/VisorLightboxFotos";
import {
  combinarTimelineChat,
  nombreIconoEventoTimeline,
  tituloEventoTimeline,
  type EventoCasoTimeline,
} from "@/lib/chat/timeline";
import type { CanalTiempoReal } from "@/lib/tiempo-real/tipos";
import { useRespaldoActualizacion } from "@/hooks/useRespaldoActualizacion";
import { useTiempoReal } from "@/hooks/useTiempoReal";
import { preprocesarImagenCliente } from "@/lib/imagen/preprocesar-cliente";
import {
  ACCEPT_INPUT_IMAGEN,
  MENSAJE_IMAGEN_ILEGIBLE,
  validarArchivoImagen,
  validarDataUrlImagen,
} from "@/lib/imagen/validar-archivo";
import { mensajeLeidoPorInterlocutor } from "@/lib/chat/lectura";
import { Icono } from "@/componentes/ui/Icono";

const ALTURA_MAX_TEXTO = 100;
const MAX_ADJUNTO_BYTES = 900_000;
const MAX_BYTES_ADJUNTO = 4 * 1024 * 1024;

type Props = {
  avistamientoId: string;
  mascotaId: string | null;
  numeroReporte: number;
  mensajesIniciales: MensajeAvistamiento[];
  eventosIniciales?: EventoCasoTimeline[];
  nombreMascota: string;
  tipoMascota?: string | null;
  miUserId?: string;
  ultimoLeidoInterlocutorAt?: Date | null;
  embed?: boolean;
  ocultarReporte?: boolean;
};

function textoVisible(contenido: string, adjuntoUrl: string | null | undefined) {
  if (parsearUbicacionMensaje(contenido)) return null;
  const t = contenido.trim();
  if (t && !esContenidoFotoPlaceholder(t)) return t;
  return null;
}

export function ChatPrivadoCaso({
  avistamientoId,
  mascotaId,
  numeroReporte,
  mensajesIniciales,
  eventosIniciales = [],
  nombreMascota,
  miUserId,
  ultimoLeidoInterlocutorAt: ultimoLeidoInicial = null,
  embed = false,
  ocultarReporte = false,
}: Props) {
  const [mensajes, setMensajes] = useState(mensajesIniciales);
  const [ultimoLeidoInterlocutor, setUltimoLeidoInterlocutor] = useState<Date | null>(
    ultimoLeidoInicial
  );
  const [texto, setTexto] = useState("");
  const [adjuntoPreview, setAdjuntoPreview] = useState<string | null>(null);
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [motivoReporte, setMotivoReporte] = useState("");
  const [interlocutorEscribiendo, setInterlocutorEscribiendo] = useState(false);
  const [eventos, setEventos] = useState(eventosIniciales);
  const [pendiente, iniciar] = useTransition();
  const mensajesRef = useRef<HTMLUListElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputArchivoRef = useRef<HTMLInputElement>(null);
  const debouncePararEscribirRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ocultarEscribiendoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geo = useGeolocalizacion();

  const sincronizarChat = useCallback(async () => {
    const datos = await listarMensajesChatAvistamiento(avistamientoId);
    if (!datos) return;
    setMensajes((prev) => {
      const idsServidor = new Set(datos.mensajes.map((m) => m.id));
      const optimistas = prev.filter(
        (m) => m.id.startsWith("temp-") && !idsServidor.has(m.id)
      );
      return [...datos.mensajes, ...optimistas];
    });
    setUltimoLeidoInterlocutor(datos.ultimoLeidoInterlocutorAt);
    if (datos.eventos) {
      setEventos(
        datos.eventos.map((e) => ({
          id: e.id,
          tipo: e.tipo,
          titulo: e.titulo,
          detalle: e.detalle,
          createdAt: e.createdAt,
        }))
      );
    }
  }, [avistamientoId]);

  const enviarUbicacionEnChat = useCallback(
    async (seleccion: UbicacionSeleccionada) => {
      const etiqueta = seleccion.etiqueta?.trim();
      const label =
        etiqueta && !pareceCoordenadas(etiqueta) ? etiqueta : ETIQUETA_GPS;

      const ubicacion: UbicacionChat = {
        lat: seleccion.lat,
        lng: seleccion.lng,
        label,
        enVivo: true,
      };

      const contenido = serializarUbicacionChat(ubicacion);
      const tempId = `temp-${Date.now()}`;
      setMensajes((prev) => [
        ...prev,
        {
          id: tempId,
          avistamientoId,
          userId: miUserId ?? null,
          autorNombre: null,
          contenido,
          adjuntoUrl: null,
          createdAt: new Date(),
        },
      ]);

      setError(null);
      const res = await enviarMensajeAvistamiento(avistamientoId, contenido, null);
      if (!res.ok) {
        setMensajes((prev) => prev.filter((m) => m.id !== tempId));
        setError(res.error ?? "No se pudo enviar la ubicación.");
        return;
      }
      await sincronizarChat();
    },
    [avistamientoId, miUserId, sincronizarChat]
  );

  const procesarResultadoUbicacion = useCallback(
    (resultado: Awaited<ReturnType<typeof geo.obtenerUbicacion>>) => {
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      iniciar(async () => {
        await enviarUbicacionEnChat(resultado.ubicacion);
      });
    },
    [enviarUbicacionEnChat, iniciar]
  );

  const { solicitarUbicacion, dialogoPermiso } = useSolicitudUbicacion({
    obtenerUbicacion: geo.obtenerUbicacion,
    onResultado: procesarResultadoUbicacion,
  });

  const timeline = useMemo(
    () => combinarTimelineChat(mensajes, eventos),
    [mensajes, eventos]
  );

  function ajustarAlturaTexto(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, ALTURA_MAX_TEXTO)}px`;
  }

  useEffect(() => {
    void marcarChatLeido(avistamientoId);
  }, [avistamientoId, mensajes.length]);

  useEffect(() => {
    queueMicrotask(() => setEventos(eventosIniciales));
  }, [eventosIniciales]);

  useEffect(() => {
    return () => {
      if (debouncePararEscribirRef.current) {
        clearTimeout(debouncePararEscribirRef.current);
      }
      if (ocultarEscribiendoRef.current) {
        clearTimeout(ocultarEscribiendoRef.current);
      }
    };
  }, [avistamientoId]);

  useEffect(() => {
    const lista = mensajesRef.current;
    if (!lista) return;
    requestAnimationFrame(() => {
      lista.scrollTop = lista.scrollHeight;
    });
  }, [mensajes, adjuntoPreview, timeline.length]);

  const canales: CanalTiempoReal[] = [`avistamiento:${avistamientoId}`];
  if (mascotaId) canales.push(`mascota:${mascotaId}`);
  const { conectado: wsConectado, enviar: enviarWs } = useTiempoReal(canales, (ev) => {
    if (ev.tipo === "mensaje:nuevo" && ev.avistamientoId === avistamientoId) {
      void sincronizarChat();
      return;
    }
    if (ev.tipo === "caso:actualizado" && ev.mascotaId === mascotaId) {
      void sincronizarChat();
      return;
    }
    if (
      ev.tipo === "chat:leido" &&
      ev.avistamientoId === avistamientoId &&
      ev.userId !== miUserId
    ) {
      setUltimoLeidoInterlocutor(new Date(ev.leidoAt));
      return;
    }
    if (
      ev.tipo === "chat:escribiendo" &&
      ev.avistamientoId === avistamientoId &&
      ev.userId !== miUserId
    ) {
      setInterlocutorEscribiendo(ev.activo);
      if (ocultarEscribiendoRef.current) {
        clearTimeout(ocultarEscribiendoRef.current);
      }
      if (ev.activo) {
        ocultarEscribiendoRef.current = setTimeout(() => {
          setInterlocutorEscribiendo(false);
        }, 4000);
      }
    }
  });

  const emitirPresenciaEscribiendo = useCallback(
    (activo: boolean) => {
      if (!miUserId) return;
      enviarWs({
        accion: "presencia",
        tipo: "escribiendo",
        avistamientoId,
        userId: miUserId,
        activo,
      });
    },
    [avistamientoId, enviarWs, miUserId]
  );

  function onCambioTexto(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const valor = e.target.value;
    setTexto(valor);
    ajustarAlturaTexto(e.target);

    if (!miUserId) return;
    if (debouncePararEscribirRef.current) {
      clearTimeout(debouncePararEscribirRef.current);
    }
    if (valor.trim()) {
      emitirPresenciaEscribiendo(true);
      debouncePararEscribirRef.current = setTimeout(() => {
        emitirPresenciaEscribiendo(false);
      }, 2200);
    } else {
      emitirPresenciaEscribiendo(false);
    }
  }

  /** En Vercel no hay WS embebido: refresco periódico si no hay WebSocket. */
  useRespaldoActualizacion(() => {
    void sincronizarChat();
  }, wsConectado, 8_000);

  useEffect(() => {
    queueMicrotask(() => setMensajes(mensajesIniciales));
  }, [mensajesIniciales]);

  useEffect(() => {
    queueMicrotask(() => setUltimoLeidoInterlocutor(ultimoLeidoInicial));
  }, [ultimoLeidoInicial]);

  async function onSeleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    const validacion = validarArchivoImagen(archivo, {
      maxBytes: MAX_BYTES_ADJUNTO,
    });
    if (!validacion.ok) {
      setError(validacion.error);
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const raw = reader.result?.toString();
      if (!raw) {
        setError(MENSAJE_IMAGEN_ILEGIBLE);
        return;
      }
      const okData = validarDataUrlImagen(raw);
      if (!okData.ok) {
        setError(okData.error);
        return;
      }
      try {
        const comprimida = await preprocesarImagenCliente(raw, {
          ladoMax: 800,
          calidad: 0.78,
        });
        if (comprimida.length > MAX_ADJUNTO_BYTES) {
          setError("La imagen sigue siendo muy pesada.");
          return;
        }
        setAdjuntoPreview(comprimida);
      } catch {
        setError(MENSAJE_IMAGEN_ILEGIBLE);
      }
    };
    reader.onerror = () => setError(MENSAJE_IMAGEN_ILEGIBLE);
    reader.readAsDataURL(archivo);
  }

  function enviar() {
    const cuerpo = texto.trim();
    const adjuntoEnviar = adjuntoPreview;
    if (!cuerpo && !adjuntoEnviar) return;

    const tempId = `temp-${Date.now()}`;
    const optimista: MensajeAvistamiento = {
      id: tempId,
      avistamientoId,
      userId: miUserId ?? null,
      autorNombre: null,
      contenido: cuerpo || ETIQUETA_MENSAJE_FOTO,
      adjuntoUrl: adjuntoEnviar,
      createdAt: new Date(),
    };

    setMensajes((prev) => [...prev, optimista]);
    setTexto("");
    setAdjuntoPreview(null);
    emitirPresenciaEscribiendo(false);
    ajustarAlturaTexto(textareaRef.current);

    iniciar(async () => {
      setError(null);
      let res: { ok: boolean; error?: string };
      if (adjuntoEnviar) {
        const blob = await fetch(adjuntoEnviar).then((r) => r.blob());
        const fd = new FormData();
        fd.append("avistamientoId", avistamientoId);
        fd.append("contenido", cuerpo);
        fd.append("imagen", blob, "chat.jpg");
        const http = await fetch("/api/avistamiento/mensaje", {
          method: "POST",
          body: fd,
        });
        res = (await http.json()) as { ok: boolean; error?: string };
      } else {
        res = await enviarMensajeAvistamiento(avistamientoId, cuerpo, null);
      }
      if (!res.ok) {
        setMensajes((prev) => prev.filter((m) => m.id !== tempId));
        setError(res.error ?? "No se pudo enviar.");
        if (cuerpo) setTexto(cuerpo);
        if (adjuntoEnviar) setAdjuntoPreview(adjuntoEnviar);
        return;
      }
      await sincronizarChat();
    });
  }

  function enviarReporte() {
    iniciar(async () => {
      const res = await reportarComportamientoSospechoso(
        avistamientoId,
        motivoReporte
      );
      if (!res.ok) {
        setError(res.error ?? "No se pudo reportar.");
        return;
      }
      setMostrarReporte(false);
      setMotivoReporte("");
    });
  }

  function insertarUbicacion() {
    setError(null);
    void solicitarUbicacion().then((resultado) => {
      if (resultado !== null) {
        procesarResultadoUbicacion(resultado);
      }
    });
  }

  function accionEmergencia() {
    setMostrarReporte(true);
  }

  function estadoRecibo(m: MensajeAvistamiento, enviando: boolean) {
    if (enviando) return { estado: "pendiente" as const, etiqueta: "Enviando" };
    if (mensajeLeidoPorInterlocutor(m.createdAt, ultimoLeidoInterlocutor)) {
      return { estado: "leido" as const, etiqueta: "Leído" };
    }
    return { estado: "enviado" as const, etiqueta: "Enviado" };
  }

  const puedeEnviar = Boolean(texto.trim() || adjuntoPreview) && !pendiente;

  return (
    <section
      className={`pp-chat-privado pp-chat-privado--coord${embed ? " pp-chat-privado--embed" : ""}`}
      aria-label={`Coordinación avistamiento #${numeroReporte}`}
    >
      {!embed && !ocultarReporte && (
        <header className="pp-chat-privado-header pp-chat-privado-header--compacto">
          <strong>Avistamiento #{numeroReporte}</strong>
          <button
            type="button"
            className="pp-chat-reportar-btn"
            onClick={() => setMostrarReporte((v) => !v)}
          >
            Reportar
          </button>
        </header>
      )}

      {mostrarReporte && !ocultarReporte && (
        <div className="pp-chat-reporte-panel pp-chat-reporte-panel--compacto">
          <textarea
            rows={2}
            value={motivoReporte}
            onChange={(e) => setMotivoReporte(e.target.value)}
            placeholder="Describe qué ocurrió…"
          />
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

      <div className="pp-chat-privado-scroll">
        <ul
          ref={mensajesRef}
          className="pp-chat-privado-mensajes pp-chat-privado-mensajes--coord"
        >
          {timeline.length === 0 && (
            <li className="pp-chat-privado-vacio">
              Coordina la búsqueda de {nombreMascota} desde aquí.
            </li>
          )}
          {timeline.map((item, indiceTimeline) => {
          const fechaActual = item.fecha;
          const fechaAnterior =
            indiceTimeline > 0 ? timeline[indiceTimeline - 1]!.fecha : undefined;
          const mostrarFecha = mostrarSeparadorFecha(fechaActual, fechaAnterior);

          if (item.tipo === "evento") {
            const ev = item.data;
            return (
              <li key={`ev-${ev.id}`}>
                {mostrarFecha && (
                  <div className="pp-chat-fecha-linea" role="separator">
                    <span>{etiquetaFechaChat(fechaActual)}</span>
                  </div>
                )}
                <div className="pp-coord-evento">
                  <span className="pp-coord-evento-icono" aria-hidden>
                    <Icono nombre={nombreIconoEventoTimeline(ev.tipo)} size={16} />
                  </span>
                  <div className="pp-coord-evento-cuerpo">
                    <strong>{tituloEventoTimeline(ev)}</strong>
                    {ev.detalle && <p>{ev.detalle}</p>}
                    <time dateTime={fechaActual.toISOString()}>
                      {formatearHoraMensaje(fechaActual)}
                    </time>
                  </div>
                </div>
              </li>
            );
          }

          const m = item.data;
          const esPropio = esMensajePropio(m, miUserId);
          const ubicacion = parsearUbicacionMensaje(m.contenido);
          const cuerpo = textoVisible(m.contenido, m.adjuntoUrl);
          const urlImagen = urlParaMostrarAdjunto(m.adjuntoUrl);
          const adjuntoRoto = Boolean(m.adjuntoUrl?.trim()) && !urlImagen;
          const enviando = esPropio && m.id.startsWith("temp-");

          return (
            <li key={m.id}>
              {mostrarFecha && (
                <div className="pp-chat-fecha-linea" role="separator">
                  <span>{etiquetaFechaChat(fechaActual)}</span>
                </div>
              )}
              <div
                className={`pp-chat-fila${esPropio ? " pp-chat-fila--propio" : " pp-chat-fila--ajeno"}`}
              >
                <div
                  className={`pp-chat-burbuja pp-chat-burbuja--coord${esPropio ? " pp-chat-burbuja--propio" : " pp-chat-burbuja--ajeno"}${ubicacion ? " pp-chat-burbuja--ubicacion" : ""}`}
                >
                  <div className="pp-chat-burbuja-cuerpo">
                    {ubicacion && <BurbujaUbicacionChat ubicacion={ubicacion} />}
                    {adjuntoRoto && (
                      <p className="pp-chat-adjunto-roto" role="status">
                        <Icono nombre="imagen" size={14} className="pp-chat-adjunto-roto-icono" />
                        No se pudo cargar la imagen
                      </p>
                    )}
                    {!ubicacion && urlImagen && (
                      <button
                        type="button"
                        className="pp-chat-adjunto-btn"
                        aria-label="Ver imagen ampliada"
                        onClick={() => setImagenAmpliada(urlImagen)}
                      >
                        <img
                          src={urlImagen}
                          alt="Imagen adjunta"
                          className="pp-chat-adjunto-img"
                        />
                      </button>
                    )}
                    <div className="pp-chat-burbuja-inner">
                      {cuerpo && (
                        <span className="pp-chat-burbuja-texto">{cuerpo}</span>
                      )}
                      <span className="pp-chat-burbuja-meta">
                        <time dateTime={fechaActual.toISOString()}>
                          {formatearHoraMensaje(fechaActual)}
                        </time>
                        {esPropio && (() => {
                          const recibo = estadoRecibo(m, enviando);
                          return (
                            <span
                              className={`pp-chat-leido${
                                recibo.estado === "leido" ? " pp-chat-leido--visto" : ""
                              }${recibo.estado === "pendiente" ? " pp-chat-leido--pendiente" : ""}`}
                              aria-label={recibo.etiqueta}
                            >
                              {recibo.estado === "pendiente" && "…"}
                              {recibo.estado === "enviado" && (
                                <Icono nombre="check" size={12} />
                              )}
                              {recibo.estado === "leido" && (
                                <Icono nombre="dobleCheck" size={12} />
                              )}
                            </span>
                          );
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
        </ul>

        {error && (
          <p className="auth-alerta auth-alerta--error pp-chat-error" role="alert">
            {error}
          </p>
        )}

        {adjuntoPreview && (
          <div className="pp-chat-adjunto-preview">
            <img src={adjuntoPreview} alt="Vista previa" />
            <button
              type="button"
              className="pp-chat-adjunto-quitar"
              onClick={() => setAdjuntoPreview(null)}
              aria-label="Quitar imagen"
            >
              <Icono nombre="cerrar" size={14} />
            </button>
          </div>
        )}
      </div>

      {interlocutorEscribiendo && (
        <p className="pp-chat-escribiendo" aria-live="polite">
          escribiendo…
        </p>
      )}

      <div className="pp-chat-privado-composer">
        <div className="pp-coord-acciones-rapidas" role="toolbar" aria-label="Acciones rápidas">
        <button
          type="button"
          className="pp-coord-accion-rapida"
          title="Foto"
          aria-label="Adjuntar foto"
          onClick={() => inputArchivoRef.current?.click()}
          disabled={pendiente}
        >
          <Icono nombre="camara" size={18} />
        </button>
        <button
          type="button"
          className="pp-coord-accion-rapida"
          title="Enviar mi ubicación actual"
          aria-label="Enviar ubicación actual"
          onClick={insertarUbicacion}
          disabled={pendiente || geo.cargando}
        >
          <Icono nombre="ubicacion" size={18} />
        </button>
        <button
          type="button"
          className="pp-coord-accion-rapida"
          title="Avistamiento"
          aria-label="Insertar referencia al avistamiento"
          onClick={() =>
            setTexto((t) =>
              t
                ? `${t}\nAvistamiento #${numeroReporte}`
                : `Avistamiento #${numeroReporte} sobre ${nombreMascota}`
            )
          }
        >
          <Icono nombre="ojo" size={18} />
        </button>
        <button
          type="button"
          className="pp-coord-accion-rapida"
          title="Contacto"
          aria-label="Insertar solicitud de contacto telefónico"
          onClick={() =>
            setTexto((t) =>
              t ? `${t}\n¿Podemos hablar por teléfono?` : "¿Podemos hablar por teléfono?"
            )
          }
        >
          <Icono nombre="telefono" size={18} />
        </button>
        <button
          type="button"
          className="pp-coord-accion-rapida pp-coord-accion-rapida--alerta"
          title="Emergencia"
          aria-label="Reportar comportamiento sospechoso"
          onClick={accionEmergencia}
        >
          <Icono nombre="alerta" size={18} />
        </button>
      </div>

      <div className="pp-chat-privado-input pp-chat-privado-input--coord">
        <input
          ref={inputArchivoRef}
          type="file"
          accept={ACCEPT_INPUT_IMAGEN}
          className="pp-chat-input-archivo"
          onChange={onSeleccionarArchivo}
          aria-hidden
          tabIndex={-1}
        />
        <textarea
          ref={textareaRef}
          rows={1}
          value={texto}
          onChange={onCambioTexto}
          placeholder="Coordina la búsqueda…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (puedeEnviar) enviar();
            }
          }}
        />
        <button
          type="button"
          className="pp-chat-enviar-btn pp-chat-enviar-btn--coord"
          disabled={!puedeEnviar}
          onClick={enviar}
          aria-label="Enviar mensaje"
        >
          <Icono nombre="enviar" size={18} />
        </button>
      </div>
      </div>

      <VisorLightboxFotos
        fotos={
          imagenAmpliada
            ? [{ id: "chat-adjunto", url: imagenAmpliada }]
            : []
        }
        indice={0}
        nombre="Imagen del mensaje"
        abierto={Boolean(imagenAmpliada)}
        onCerrar={() => setImagenAmpliada(null)}
        onCambiarIndice={() => {}}
      />

      {dialogoPermiso}
    </section>
  );
}
