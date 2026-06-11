"use client";



/**
 * [casos] Contenedor: hub chats.
 */
/**
 * [casos] Contenedor: hub chats.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  listarConversaciones,
  type ConversacionHub,
} from "@/actions/chat";
import { EtiquetaRolParticipante } from "@/componentes/casos/EtiquetaRolParticipante";
import { Icono, iconoPorTipoMascota } from "@/componentes/ui/Icono";
import { horaRelativaChat } from "@/lib/chat/tiempo";
import { useTiempoRealConRespaldo } from "@/hooks/useTiempoRealConRespaldo";

function previewHub(conv: ConversacionHub) {
  if (conv.ultimoPreview?.trim()) {
    const t = conv.ultimoPreview.trim();
    return t.length > 48 ? `${t.slice(0, 47)}…` : t;
  }
  return "Sin mensajes aún";
}

type Props = {
  conversacionesIniciales: ConversacionHub[];
};

export function ContenedorHubChats({ conversacionesIniciales }: Props) {
  const { data: sesion, status } = useSession();
  const [conversaciones, setConversaciones] = useState(conversacionesIniciales);

  useEffect(() => {
    queueMicrotask(() => setConversaciones(conversacionesIniciales));
  }, [conversacionesIniciales]);

  const recargar = useCallback(async () => {
    const datos = await listarConversaciones();
    setConversaciones(datos);
  }, []);

  const userId = sesion?.user?.id;
  useTiempoRealConRespaldo(
    userId ? [`usuario:${userId}`] : [],
    (ev) => {
      if (
        ev.tipo === "notificacion:nueva" ||
        ev.tipo === "mensaje:nuevo" ||
        ev.tipo === "chat:leido"
      ) {
        void recargar();
      }
    },
    () => {
      if (status === "authenticated") void recargar();
    },
    12_000
  );

  if (conversaciones.length === 0) {
    return (
      <div className="mascotas-vacio tarjeta-panel">
        <span className="mascotas-vacio-icono" aria-hidden>
          <Icono nombre="mensaje" size={40} />
        </span>
        <h2>Sin conversaciones</h2>
        <p>
          Cuando recibas o envíes un reporte de avistamiento, aquí aparecerá el
          chat de cada reporte.
        </p>
        <Link href="/mis-mascotas" className="btn-mascota btn-mascota--primario">
          Ir a mis mascotas
        </Link>
      </div>
    );
  }

  return (
    <section className="mascotas-casos-resumen" aria-labelledby="chats-lista-titulo">

      <ul className="mascotas-casos-resumen-lista">
        {conversaciones.map((c) => (
          <li key={c.avistamientoId}>
            <Link href={c.enlace} className="acceso-caso acceso-caso--enlace">
              <span className="acceso-caso-avatar">
                {c.fotoPrincipal ? (
                  <img
                    src={c.fotoPrincipal}
                    alt=""
                    className="acceso-caso-avatar-img"
                    width={48}
                    height={48}
                  />
                ) : (
                  <span className="acceso-caso-avatar-placeholder" aria-hidden>
                    <Icono nombre={iconoPorTipoMascota(c.tipo)} size={24} />
                  </span>
                )}
                {c.noLeidos > 0 && (
                  <span className="acceso-caso-avatar-badge">
                    {c.noLeidos > 9 ? "9+" : c.noLeidos}
                  </span>
                )}
              </span>
              <span className="acceso-caso-texto">
                <span className="acceso-caso-nombre">
                  {c.nombreMascota} · #{c.numeroReporte}
                  <EtiquetaRolParticipante
                    rol={c.papel}
                    className="acceso-caso-papel"
                  />
                </span>
                <span className="acceso-caso-preview">{previewHub(c)}</span>
              </span>
              <span className="acceso-caso-meta">
                {c.ultimoActividad && (
                  <time dateTime={c.ultimoActividad.toISOString()}>
                    {horaRelativaChat(c.ultimoActividad)}
                  </time>
                )}
                <Icono nombre="derecha" size={18} className="acceso-caso-flecha" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
