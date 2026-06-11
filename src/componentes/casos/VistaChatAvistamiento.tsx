"use client";



/**
 * [casos] Vista: chat avistamiento.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { reportarComportamientoSospechoso } from "@/actions/casos";
import { cambiarEstadoMascota } from "@/actions/mascotas";
import { CabeceraCoordinacion } from "@/componentes/casos/CabeceraCoordinacion";
import { ChatPrivadoCaso } from "@/componentes/casos/ChatPrivadoCaso";
import { MetaParticipanteChat } from "@/componentes/casos/MetaParticipanteChat";
import { Icono } from "@/componentes/ui/Icono";
import { resolverConversacionAvistamiento } from "@/lib/chat/participantes";
import { rolParticipante } from "@/lib/chat/roles";
import type { EventoCasoTimeline } from "@/lib/chat/timeline";
import type { Avistamiento, EstadoMascota, MensajeAvistamiento } from "@/lib/db/schema";

type MascotaCabecera = {
  id: string;
  nombre: string;
  tipo: string;
  slug: string;
  estado: EstadoMascota;
  fotoPrincipal: string | null;
};

type Props = {
  avistamiento: Avistamiento;
  mascota: MascotaCabecera | null;
  resumenCabecera: {
    totalAvistamientos: number;
    ultimoAvistamientoDireccion: string | null;
  };
  mensajes: MensajeAvistamiento[];
  eventos: EventoCasoTimeline[];
  esDueno: boolean;
  miUserId: string;
  duenoUserId: string;
  duenoNombre: string;
  duenoImagen: string | null;
  reportanteUserId: string | null;
  reportanteNombre: string;
  reportanteImagen: string | null;
  nombreMascota: string | null;
  tipoMascota: string | null;
  ultimoLeidoInterlocutorAt: Date | null;
};

export function VistaChatAvistamiento({
  avistamiento,
  mascota,
  resumenCabecera,
  mensajes,
  eventos,
  esDueno,
  miUserId,
  duenoUserId,
  duenoNombre,
  duenoImagen,
  reportanteUserId,
  reportanteNombre,
  reportanteImagen,
  nombreMascota,
  tipoMascota,
  ultimoLeidoInterlocutorAt,
}: Props) {
  const router = useRouter();
  const [marcando, iniciarMarcar] = useTransition();
  const [reporteAbierto, setReporteAbierto] = useState(false);
  const [motivoReporte, setMotivoReporte] = useState("");
  const [errorReporte, setErrorReporte] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const conversacion = resolverConversacionAvistamiento(miUserId, {
    duenoUserId,
    duenoNombre,
    duenoImagen,
    reportanteUserId,
    reportanteNombre,
    reportanteImagen,
    nombreMascota,
    tipoMascota,
  });

  const rolOtro = rolParticipante(
    conversacion.otro.userId,
    duenoUserId,
    reportanteUserId
  );

  function enviarReporte() {
    iniciar(async () => {
      setErrorReporte(null);
      const res = await reportarComportamientoSospechoso(
        avistamiento.id,
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

  function marcarEncontrado() {
    if (!mascota) return;
    if (!window.confirm(`¿Confirmas que ${mascota.nombre} ya fue encontrada?`)) return;
    iniciarMarcar(async () => {
      const res = await cambiarEstadoMascota(mascota.id, "REUNIDA");
      if (res.ok) {
        router.push("/mis-mascotas");
        router.refresh();
      } else {
        alert(res.error ?? "No se pudo actualizar el estado.");
      }
    });
  }

  return (
    <div className="pp-coord pp-coord--standalone">
      <nav className="pp-coord-nav" aria-label="Navegación">
        <Link href="/chats" className="pp-coord-nav-enlace pp-enlace-icono">
          <Icono nombre="izquierda" size={14} />
          Mensajes
        </Link>
      </nav>

      {mascota && mascota.estado === "PERDIDA" && (
        <CabeceraCoordinacion
          mascota={mascota}
          resumen={resumenCabecera}
          onMarcarEncontrado={esDueno ? marcarEncontrado : undefined}
          marcando={marcando}
        />
      )}

      <header className="pp-coord-chat-header pp-coord-chat-header--pagina">
        <div className="pp-coord-chat-header-principal">
          {conversacion.otro.imagen ? (
            <img
              src={conversacion.otro.imagen}
              alt=""
              className="pp-coord-chat-header-avatar"
              width={32}
              height={32}
            />
          ) : (
            <span className="pp-coord-chat-header-iniciales" aria-hidden>
              {conversacion.otro.nombre.slice(0, 1)}
            </span>
          )}
          <div className="pp-coord-chat-header-identidad">
            <strong>{conversacion.otro.nombre}</strong>
            <MetaParticipanteChat
              rol={rolOtro}
              numeroReporte={avistamiento.numeroReporte}
            />
          </div>
        </div>
        <div className="pp-coord-chat-header-acciones">
          <button
            type="button"
            className="pp-chat-reportar-btn"
            onClick={() => setReporteAbierto((v) => !v)}
            aria-expanded={reporteAbierto}
          >
            Reportar
          </button>
        </div>
      </header>

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

      <div className="pp-coord-standalone-chat">
        <ChatPrivadoCaso
          avistamientoId={avistamiento.id}
          mascotaId={avistamiento.mascotaId}
          numeroReporte={avistamiento.numeroReporte}
          mensajesIniciales={mensajes}
          eventosIniciales={eventos}
          nombreMascota={nombreMascota ?? "Mascota"}
          tipoMascota={tipoMascota}
          miUserId={miUserId}
          ultimoLeidoInterlocutorAt={ultimoLeidoInterlocutorAt}
          embed
          ocultarReporte
        />
      </div>
    </div>
  );
}
