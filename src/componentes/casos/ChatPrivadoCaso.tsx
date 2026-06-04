"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { enviarMensajeAvistamiento } from "@/actions/avistamientos";
import { marcarChatLeido, reportarComportamientoSospechoso } from "@/actions/casos";
import type { MensajeAvistamiento } from "@/lib/db/schema";
import {
  esMensajePropio,
  etiquetaFechaChat,
  formatearHoraMensaje,
  mostrarSeparadorFecha,
  urlParaMostrarAdjunto,
} from "@/lib/chat/mensaje";
import { VisorLightboxFotos } from "@/componentes/mascotas/VisorLightboxFotos";
import {
  combinarTimelineChat,
  iconoEventoTimeline,
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
  esDueno: boolean;
  nombreMascota: string;
  tipoMascota?: string | null;
  duenoUserId: string;
  duenoNombre: string;
  reportanteUserId: string | null;
  reportanteNombre?: string;
  miUserId?: string;
  direccionAvistamiento?: string | null;
  latAvistamiento?: string | null;
  lngAvistamiento?: string | null;
  embed?: boolean;
  ocultarReporte?: boolean;
};

function textoVisible(contenido: string, adjuntoUrl: string | null | undefined) {
  const t = contenido.trim();
  if (t && t !== "📷 Foto") return t;
  return null;
}

export function ChatPrivadoCaso({
  avistamientoId,
  mascotaId,
  numeroReporte,
  mensajesIniciales,
  eventosIniciales = [],
  esDueno,
  nombreMascota,
  miUserId,
  direccionAvistamiento,
  latAvistamiento,
  lngAvistamiento,
  embed = false,
  ocultarReporte = false,
}: Props) {
  const router = useRouter();
  const [mensajes, setMensajes] = useState(mensajesIniciales);
  const [texto, setTexto] = useState("");
  const [adjuntoPreview, setAdjuntoPreview] = useState<string | null>(null);
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [motivoReporte, setMotivoReporte] = useState("");
  const [pendiente, iniciar] = useTransition();
  const finRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  const timeline = useMemo(
    () => combinarTimelineChat(mensajes, eventosIniciales),
    [mensajes, eventosIniciales]
  );

  function ajustarAlturaTexto(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, ALTURA_MAX_TEXTO)}px`;
  }

  function onCambioTexto(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setTexto(e.target.value);
    ajustarAlturaTexto(e.target);
  }

  useEffect(() => {
    void marcarChatLeido(avistamientoId);
  }, [avistamientoId]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, adjuntoPreview, timeline.length]);

  const canales: CanalTiempoReal[] = [`avistamiento:${avistamientoId}`];
  if (mascotaId) canales.push(`mascota:${mascotaId}`);
  const { conectado: wsConectado } = useTiempoReal(canales, (ev) => {
    if (ev.tipo === "mensaje:nuevo" && ev.avistamientoId === avistamientoId) {
      router.refresh();
    }
  });

  /** En Vercel no hay WS embebido: refresco cada pocos segundos si no hay WebSocket. */
  useRespaldoActualizacion(() => router.refresh(), wsConectado, 8_000);

  useEffect(() => {
    setMensajes(mensajesIniciales);
  }, [mensajesIniciales]);

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
      contenido: cuerpo || "📷 Foto",
      adjuntoUrl: adjuntoEnviar,
      createdAt: new Date(),
    };

    setMensajes((prev) => [...prev, optimista]);
    setTexto("");
    setAdjuntoPreview(null);
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
      router.refresh();
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
    if (direccionAvistamiento?.trim()) {
      setTexto((t) =>
        t ? `${t}\n📍 ${direccionAvistamiento}` : `📍 ${direccionAvistamiento}`
      );
      return;
    }
    if (latAvistamiento && lngAvistamiento) {
      const url = `https://maps.google.com/?q=${latAvistamiento},${lngAvistamiento}`;
      setTexto((t) => (t ? `${t}\n📍 ${url}` : `📍 ${url}`));
      return;
    }
    setError("No hay ubicación registrada para este avistamiento.");
  }

  function accionEmergencia() {
    setMostrarReporte(true);
  }

  const puedeEnviar = Boolean(texto.trim() || adjuntoPreview) && !pendiente;

  let fechaAnteriorTimeline: Date | undefined;

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

      <ul className="pp-chat-privado-mensajes pp-chat-privado-mensajes--coord">
        {timeline.length === 0 && (
          <li className="pp-chat-privado-vacio">
            Coordina la búsqueda de {nombreMascota} desde aquí.
          </li>
        )}
        {timeline.map((item) => {
          const fechaActual = item.fecha;
          const mostrarFecha = mostrarSeparadorFecha(fechaActual, fechaAnteriorTimeline);
          fechaAnteriorTimeline = fechaActual;

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
                    {iconoEventoTimeline(ev.tipo)}
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
                  className={`pp-chat-burbuja pp-chat-burbuja--coord${esPropio ? " pp-chat-burbuja--propio" : " pp-chat-burbuja--ajeno"}`}
                >
                  <div className="pp-chat-burbuja-cuerpo">
                    {adjuntoRoto && (
                      <p className="pp-chat-adjunto-roto" role="status">
                        📷 No se pudo cargar la imagen
                      </p>
                    )}
                    {urlImagen && (
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
                        {esPropio && (
                          <span
                            className="pp-chat-leido"
                            aria-label={enviando ? "Enviando" : "Enviado"}
                          >
                            {enviando ? "…" : "✓"}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
        <div ref={finRef} />
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

      <div className="pp-coord-acciones-rapidas" role="toolbar" aria-label="Acciones rápidas">
        <button
          type="button"
          title="Foto"
          onClick={() => inputArchivoRef.current?.click()}
          disabled={pendiente}
        >
          📷
        </button>
        <button type="button" title="Ubicación" onClick={insertarUbicacion}>
          📍
        </button>
        <button
          type="button"
          title="Avistamiento"
          onClick={() =>
            setTexto((t) =>
              t
                ? `${t}\n👀 Avistamiento #${numeroReporte}`
                : `👀 Avistamiento #${numeroReporte} sobre ${nombreMascota}`
            )
          }
        >
          👀
        </button>
        <button
          type="button"
          title="Contacto"
          onClick={() =>
            setTexto((t) => (t ? `${t}\n☎ ¿Podemos hablar por teléfono?` : "☎ ¿Podemos hablar por teléfono?"))
          }
        >
          ☎
        </button>
        <button type="button" title="Emergencia" onClick={accionEmergencia}>
          🚨
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
    </section>
  );
}
