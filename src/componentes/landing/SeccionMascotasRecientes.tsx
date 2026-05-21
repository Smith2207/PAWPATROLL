"use client";

import { useModales } from "@/contexto/ContextoModales";
import { BadgeEstadoMascota } from "@/componentes/mascotas/BadgeEstadoMascota";
import type { EstadoMascota } from "@/lib/db/schema";
import Link from "next/link";

export type MascotaPublicaTarjeta = {
  id: string;
  slug: string;
  nombre: string;
  tipo: string;
  raza: string | null;
  sexo: string | null;
  edad: string | null;
  color: string | null;
  estado: EstadoMascota;
  lugarPerdida: string | null;
  fechaPerdida: Date | null;
  updatedAt: Date;
  fotoPrincipal: string | null;
};

const EMOJI: Record<string, string> = {
  Perro: "🐕",
  Gato: "🐱",
  Ave: "🐦",
};

type Props = {
  mascotas: MascotaPublicaTarjeta[];
};

function tiempoRelativo(fecha: Date) {
  const diff = Date.now() - new Date(fecha).getTime();
  const horas = Math.floor(diff / 3_600_000);
  if (horas < 1) return "hace unos minutos";
  if (horas < 24) return `hace ${horas}h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias}d`;
}

export function SeccionMascotasRecientes({ mascotas }: Props) {
  const { abrirModal } = useModales();

  return (
    <div className="section-wrap" id="avistamientos" style={{ paddingTop: 0 }}>
      <div
        className="section-header section-header--izq"
        style={{ marginBottom: "1.8rem" }}
      >
        <div className="section-eyebrow">En tiempo real</div>
        <div className="section-title">Avistamientos y mascotas perdidas 🐶🐱</div>
        <p className="section-sub">
          Fichas públicas de la comunidad: perdidas, encontradas y en seguimiento
        </p>
      </div>
      <div className="pets-header">
        <h2>Casos activos</h2>
        <button
          type="button"
          className="see-all"
          style={{ background: "none", border: "none", font: "inherit" }}
          onClick={() => abrirModal("sighting")}
        >
          👁️ Reportar avistamiento →
        </button>
      </div>

      {mascotas.length === 0 ? (
        <p
          style={{
            fontWeight: 700,
            color: "var(--muted)",
            padding: "1rem 0",
          }}
        >
          Aún no hay mascotas perdidas publicadas.{" "}
          <Link href="/mis-mascotas/nueva" style={{ color: "var(--blue)" }}>
            Registra tu mascota
          </Link>{" "}
          y márcala como perdida si lo necesitas.
        </p>
      ) : (
        <div className="pets-grid">
          {mascotas.map((m) => {
            const emoji = EMOJI[m.tipo] ?? "🐾";
            return (
              <Link
                key={m.id}
                href={`/mascota/${m.slug}`}
                className="pet-card"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  className="pet-photo"
                  style={{
                    background: m.fotoPrincipal
                      ? undefined
                      : "linear-gradient(135deg,#FFF5EC,#FFEAD5)",
                  }}
                >
                  {m.fotoPrincipal ? (
                    <img
                      src={m.fotoPrincipal}
                      alt={m.nombre}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        position: "absolute",
                        inset: 0,
                      }}
                    />
                  ) : (
                    emoji
                  )}
                  <div className="time-pill">{tiempoRelativo(m.updatedAt)}</div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 10,
                      left: 10,
                      zIndex: 2,
                    }}
                  >
                    <BadgeEstadoMascota estado={m.estado} />
                  </div>
                </div>
                <div className="pet-info">
                  <div className="pet-name">{m.nombre}</div>
                  <div className="pet-breed">
                    {m.tipo}
                    {m.raza ? ` · ${m.raza}` : ""}
                    {m.edad ? ` · ${m.edad}` : ""}
                  </div>
                  {m.lugarPerdida && (
                    <div className="pet-location">📍 {m.lugarPerdida}</div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
