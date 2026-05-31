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

type Props = {
  avistamientoId: string;
  mascotaId: string | null;
  numeroReporte: number;
  mensajesIniciales: MensajeAvistamiento[];
  esDueno: boolean;
  nombreMascota: string;
};

export function ChatPrivadoCaso({
  avistamientoId,
  mascotaId,
  numeroReporte,
  mensajesIniciales,
  esDueno,
  nombreMascota,
}: Props) {
  const router = useRouter();
  const [mensajes, setMensajes] = useState(mensajesIniciales);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [motivoReporte, setMotivoReporte] = useState("");
  const [pendiente, iniciar] = useTransition();
  const finRef = useRef<HTMLDivElement>(null);

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

  return (
    <section className="pp-chat-privado" aria-label={`Chat avistamiento #${numeroReporte}`}>
      <header className="pp-chat-privado-header">
        <div>
          <strong>Chat privado · Avistamiento #{numeroReporte}</strong>
          <span>
            {esDueno
              ? `Con quien reportó sobre ${nombreMascota}`
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

      {mostrarReporte && (
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
        {mensajes.map((m) => (
          <li key={m.id} className="pp-chat-privado-msg">
            <strong>{m.autorNombre ?? "Participante"}</strong>
            <p>{m.contenido}</p>
            <time>
              {new Date(m.createdAt).toLocaleString("es-PE", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </time>
          </li>
        ))}
        <div ref={finRef} />
      </ul>

      {error && (
        <p className="auth-alerta auth-alerta--error" role="alert">
          {error}
        </p>
      )}

      <div className="pp-chat-privado-input">
        <textarea
          rows={2}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
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
          className="submit-btn submit-btn-blue"
          disabled={pendiente || !texto.trim()}
          onClick={enviar}
        >
          Enviar
        </button>
      </div>
    </section>
  );
}
