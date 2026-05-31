"use client";

import Link from "next/link";
import { TimelineCaso } from "@/componentes/casos/TimelineCaso";
import { ChatPrivadoCaso } from "@/componentes/casos/ChatPrivadoCaso";
import type { EventoCaso, Mascota, Avistamiento } from "@/lib/db/schema";
import type { MensajeAvistamiento } from "@/lib/db/schema";

type AvistamientoConChat = Avistamiento & {
  mensajes: MensajeAvistamiento[];
};

type Props = {
  mascota: Mascota;
  eventos: EventoCaso[];
  avistamientos: AvistamientoConChat[];
};

export function VistaCasoBusqueda({
  mascota,
  eventos,
  avistamientos,
}: Props) {
  const pendientes = avistamientos.filter((a) => a.estado === "PENDIENTE").length;

  return (
    <div className="pp-caso-busqueda">
      <header className="pp-caso-header">
        <div>
          <p className="pp-caso-eyebrow">Caso de búsqueda</p>
          <h1>{mascota.nombre}</h1>
          <p className="pp-caso-sub">
            Toda la actividad de este caso en un solo lugar: avistamientos,
            mensajes privados y actualizaciones.
          </p>
        </div>
        <div className="pp-caso-stats">
          <span>{avistamientos.length} avistamientos</span>
          {pendientes > 0 && (
            <span className="pp-caso-stat-alerta">{pendientes} pendientes</span>
          )}
        </div>
      </header>

      <div className="pp-caso-grid">
        <section className="pp-caso-panel">
          <h2>Línea de tiempo</h2>
          <TimelineCaso eventos={eventos} />
        </section>

        <section className="pp-caso-panel">
          <h2>Avistamientos y chats</h2>
          {avistamientos.length === 0 ? (
            <p className="pp-caso-timeline-vacio">
              Cuando alguien reporte un avistamiento, aparecerá aquí con su chat
              privado.
            </p>
          ) : (
            <ul className="pp-caso-avist-lista">
              {avistamientos.map((av) => (
                <li key={av.id} className="pp-caso-avist-item">
                  <div className="pp-caso-avist-meta">
                    <strong>#{av.numeroReporte}</strong>
                    <span
                      className={`pp-caso-avist-estado pp-caso-avist-estado--${av.estado.toLowerCase()}`}
                    >
                      {av.estado === "VERIFICADO"
                        ? "Verificado"
                        : av.estado === "DESCARTADO"
                          ? "Descartado"
                          : "Pendiente"}
                    </span>
                    <time>
                      {new Date(av.createdAt).toLocaleString("es-PE", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                  </div>
                  {av.direccion && <p>{av.direccion}</p>}
                  <ChatPrivadoCaso
                    avistamientoId={av.id}
                    mascotaId={mascota.id}
                    numeroReporte={av.numeroReporte}
                    mensajesIniciales={av.mensajes}
                    esDueno
                    nombreMascota={mascota.nombre}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="pp-caso-acciones">
        <Link href={`/mascota/${mascota.slug}`} className="btn-mascota btn-mascota--secundario">
          Ver ficha pública
        </Link>
        <Link href={`/mis-mascotas/${mascota.id}`} className="btn-mascota btn-mascota--secundario">
          Editar ficha
        </Link>
      </div>
    </div>
  );
}
