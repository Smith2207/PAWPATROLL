"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  enviarMensajeAvistamiento,
} from "@/actions/avistamientos";
import {
  marcarChatLeido,
  reportarComportamientoSospechoso,
} from "@/actions/casos";
import type { MensajeAvistamiento } from "@/lib/db/schema";
import type { CanalTiempoReal } from "@/lib/tiempo-real/tipos";
import { useTiempoReal } from "@/hooks/useTiempoReal";
import { Icono } from "@/componentes/ui/Icono";
import { useSession } from "next-auth/react";

const ALTURA_MAX_TEXTO = 120;

type Props = {
  avistamientoId: string;
  mascotaId: string | null;
  numeroReporte: number;
  mensajesIniciales: MensajeAvistamiento[];
  esDueno: boolean;
  nombreMascota: string;
  nombreReportante?: string;
  embed?: boolean;
  ocultarReporte?: boolean;
};

export function ChatPrivadoCaso({
  avistamientoId,
  mascotaId,
  numeroReporte,
  mensajesIniciales,
  esDueno,
  nombreMascota,
  nombreReportante,
  embed = false,
  ocultarReporte = false,
}: Props) {
  const router = useRouter();
  const { data: sesion } = useSession();
  const miUserId = sesion?.user?.id;
  const [mensajes, setMensajes] = useState(mensajesIniciales);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [motivoReporte, setMotivoReporte] = useState("");
  const [pendiente, iniciar] = useTransition();
  const finRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  }, [mensajes]);

  const canales: CanalTiempoReal[] = [`avistamiento:${avistamientoId}`];
  if (mascotaId) canales.push(`mascota:${mascotaId}`);
  useTiempoReal(canales, (ev) => {
    if (
      ev.tipo === "mensaje:nuevo" &&
      ev.avistamientoId === avistamientoId
    ) {
      router.refresh();
    }
  });

  useEffect(() => {
    setMensajes(mensajesIniciales);
  }, [mensajesIniciales]);

  function enviar() {
    iniciar(async () => {
      setError(null);
      const res = await enviarMensajeAvistamiento(avistamientoId, texto);
      if (!res.ok) {
        setError(res.error ?? "No se pudo enviar.");
        return;
      }
      setTexto("");
      ajustarAlturaTexto(textareaRef.current);
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

  const contraparte =
    nombreReportante ??
    (esDueno ? "quien reportó" : "el dueño");

  return (
    <section
      className={`pp-chat-privado${embed ? " pp-chat-privado--embed" : ""}`}
      aria-label={`Chat avistamiento #${numeroReporte}`}
    >
      {!embed && (
        <header className="pp-chat-privado-header">
          <div>
            <strong>Chat privado · Avistamiento #{numeroReporte}</strong>
            <span>
              {esDueno
                ? `Con ${contraparte} sobre ${nombreMascota}`
                : `Con el dueño de ${nombreMascota}`}
            </span>
          </div>
          <button
            type="button"
            className="pp-chat-reportar-btn"
            onClick={() => setMostrarReporte((v) => !v)}
          >
            Reportar
          </button>
        </header>
      )}

      {embed && !ocultarReporte && (
        <div className="pp-chat-privado-toolbar">
          <button
            type="button"
            className="pp-chat-reportar-btn"
            onClick={() => setMostrarReporte((v) => !v)}
          >
            Reportar conversación
          </button>
        </div>
      )}

      {mostrarReporte && !ocultarReporte && (
        <div className="pp-chat-reporte-panel">
          <label htmlFor={`reporte-${avistamientoId}`}>
            Comportamiento sospechoso o contenido inapropiado
          </label>
          <textarea
            id={`reporte-${avistamientoId}`}
            rows={3}
            value={motivoReporte}
            onChange={(e) => setMotivoReporte(e.target.value)}
            placeholder="Describe qué ocurrió…"
          />
          <button
            type="button"
            className="submit-btn"
            disabled={pendiente}
            onClick={enviarReporte}
          >
            Enviar reporte a moderación
          </button>
        </div>
      )}

      <ul className="pp-chat-privado-mensajes">
        {mensajes.length === 0 && (
          <li className="pp-chat-privado-vacio">
            Inicia la conversación. Solo tú y la otra parte ven estos mensajes.
          </li>
        )}
        {mensajes.map((m, i) => {
          const esPropio = Boolean(miUserId && m.userId === miUserId);
          const anterior = mensajes[i - 1];
          const mismoAutor =
            anterior &&
            ((anterior.userId && anterior.userId === m.userId) ||
              (!anterior.userId && !m.userId));
          const mostrarNombre = !esPropio && !mismoAutor;
          const nombreVisible =
            m.autorNombre ?? nombreReportante ?? "Participante";

          return (
            <li
              key={m.id}
              className={`pp-chat-fila${esPropio ? " pp-chat-fila--propio" : " pp-chat-fila--ajeno"}`}
            >
              <div
                className={`pp-chat-burbuja${esPropio ? " pp-chat-burbuja--propio" : " pp-chat-burbuja--ajeno"}`}
              >
                {mostrarNombre && (
                  <strong className="pp-chat-burbuja-autor">{nombreVisible}</strong>
                )}
                <div className="pp-chat-burbuja-cuerpo">
                  <p className="pp-chat-burbuja-texto">{m.contenido}</p>
                  <time className="pp-chat-burbuja-hora">
                    {new Date(m.createdAt).toLocaleTimeString("es-PE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              </div>
            </li>
          );
        })}
        <div ref={finRef} />
      </ul>

      {error && (
        <p className="auth-alerta auth-alerta--error" role="alert">
          {error}
        </p>
      )}

      <div className="pp-chat-privado-input">
        <textarea
          ref={textareaRef}
          rows={1}
          value={texto}
          onChange={onCambioTexto}
          placeholder="Escribe un mensaje…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (texto.trim()) enviar();
            }
          }}
        />
        <button
          type="button"
          className="pp-chat-enviar-btn"
          disabled={pendiente || !texto.trim()}
          onClick={enviar}
          aria-label="Enviar mensaje"
        >
          <Icono nombre="enviar" size={18} />
        </button>
      </div>
    </section>
  );
}
