"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  listarHubChats,
  type CasoChatHub,
  type ChatTestigoHub,
} from "@/actions/casos";
import { Icono, iconoPorTipoMascota } from "@/componentes/ui/Icono";
import { horaRelativaChat } from "@/lib/chat/tiempo";
import { useRespaldoActualizacion } from "@/hooks/useRespaldoActualizacion";
import { useTiempoReal } from "@/hooks/useTiempoReal";

function previewHub(texto: string | null, fallback: string) {
  if (!texto?.trim()) return fallback;
  const t = texto.trim();
  return t.length > 48 ? `${t.slice(0, 47)}…` : t;
}

type Props = {
  casosDuenoIniciales: CasoChatHub[];
  casosTestigoIniciales: ChatTestigoHub[];
};

export function ContenedorHubChats({
  casosDuenoIniciales,
  casosTestigoIniciales,
}: Props) {
  const { data: sesion, status } = useSession();
  const [casosDueno, setCasosDueno] = useState(casosDuenoIniciales);
  const [casosTestigo, setCasosTestigo] = useState(casosTestigoIniciales);

  useEffect(() => {
    queueMicrotask(() => {
      setCasosDueno(casosDuenoIniciales);
      setCasosTestigo(casosTestigoIniciales);
    });
  }, [casosDuenoIniciales, casosTestigoIniciales]);

  const recargar = useCallback(async () => {
    const datos = await listarHubChats();
    setCasosDueno(datos.casosDueno);
    setCasosTestigo(datos.casosTestigo);
  }, []);

  const userId = sesion?.user?.id;
  const { conectado: wsConectado } = useTiempoReal(
    userId ? [`usuario:${userId}`] : [],
    (ev) => {
      if (
        ev.tipo === "notificacion:nueva" ||
        ev.tipo === "mensaje:nuevo" ||
        ev.tipo === "chat:leido"
      ) {
        void recargar();
      }
    }
  );

  useRespaldoActualizacion(() => {
    if (status === "authenticated") void recargar();
  }, wsConectado, 12_000);

  const vacio = casosDueno.length === 0 && casosTestigo.length === 0;

  if (vacio) {
    return (
      <div className="mascotas-vacio tarjeta-panel">
        <span className="mascotas-vacio-icono" aria-hidden>
          <Icono nombre="mensaje" size={40} />
        </span>
        <h2>Sin mensajes activos</h2>
        <p>
          Cuando participes en una búsqueda o reportes un avistamiento, tus
          conversaciones aparecerán aquí.
        </p>
        <Link href="/mis-mascotas" className="btn-mascota btn-mascota--primario">
          Ir a mis mascotas
        </Link>
      </div>
    );
  }

  return (
    <>
      {casosDueno.length > 0 && (
        <section className="mascotas-casos-resumen" aria-labelledby="chats-dueno-titulo">
          <header className="mascotas-casos-resumen-cabecera">
            <h2 id="chats-dueno-titulo">Mis mascotas en búsqueda</h2>
          </header>
          <ul className="mascotas-casos-resumen-lista">
            {casosDueno.map((c) => (
              <li key={c.mascotaId}>
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
                    <span className="acceso-caso-nombre">{c.nombreMascota}</span>
                    <span className="acceso-caso-preview">
                      {previewHub(
                        c.ultimoPreview,
                        c.totalAvistamientos === 0
                          ? "Sin avistamientos aún"
                          : `${c.totalAvistamientos} avistamiento${c.totalAvistamientos === 1 ? "" : "s"}`
                      )}
                    </span>
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
      )}

      {casosTestigo.length > 0 && (
        <section className="mascotas-casos-resumen" aria-labelledby="chats-testigo-titulo">
          <header className="mascotas-casos-resumen-cabecera">
            <h2 id="chats-testigo-titulo">Mis reportes como testigo</h2>
            <p>Conversaciones con dueños sobre avistamientos que reportaste.</p>
          </header>
          <ul className="mascotas-casos-resumen-lista">
            {casosTestigo.map((c) => (
              <li key={c.avistamientoId}>
                <Link href={c.enlace} className="acceso-caso acceso-caso--enlace">
                  <span className="acceso-caso-avatar acceso-caso-avatar--sm">
                    <span className="acceso-caso-avatar-placeholder" aria-hidden>
                      <Icono nombre={iconoPorTipoMascota(c.tipoMascota)} size={16} />
                    </span>
                    {c.noLeidos > 0 && (
                      <span className="acceso-caso-avatar-badge">
                        {c.noLeidos > 9 ? "9+" : c.noLeidos}
                      </span>
                    )}
                  </span>
                  <span className="acceso-caso-texto">
                    <span className="acceso-caso-nombre">
                      {c.nombreMascota} · #{c.numeroReporte}
                    </span>
                    <span className="acceso-caso-preview">
                      {previewHub(c.ultimoPreview, "Sin mensajes aún")}
                    </span>
                  </span>
                  <span className="acceso-caso-meta">
                    <time dateTime={c.ultimoActividad.toISOString()}>
                      {horaRelativaChat(c.ultimoActividad)}
                    </time>
                    <Icono nombre="derecha" size={18} className="acceso-caso-flecha" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
