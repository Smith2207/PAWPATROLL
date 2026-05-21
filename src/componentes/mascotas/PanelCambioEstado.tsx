"use client";

import { cambiarEstadoMascota } from "@/actions/mascotas";
import { BadgeEstadoMascota } from "@/componentes/mascotas/BadgeEstadoMascota";
import type { EstadoMascota, Mascota } from "@/lib/db/schema";
import {
  ETIQUETAS_ESTADO,
  TRANSICIONES_ESTADO,
  esFichaPublica,
} from "@/lib/mascotas/estados";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ACCIONES: Partial<
  Record<EstadoMascota, { label: string; variant?: string }>
> = {
  PERDIDA: { label: "🔴 Marcar como perdida" },
  ENCONTRADA: { label: "🟡 Marcar como encontrada" },
  REUNIDA: { label: "🟢 Marcar como reunida" },
  EN_CASA: { label: "🏠 Volver a en casa" },
};

type Props = {
  mascota: Mascota;
};

export function PanelCambioEstado({ mascota }: Props) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [mostrarPerdida, setMostrarPerdida] = useState(false);
  const [lugar, setLugar] = useState(mascota.lugarPerdida ?? "");
  const [fecha, setFecha] = useState(
    mascota.fechaPerdida
      ? new Date(mascota.fechaPerdida).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [notas, setNotas] = useState("");

  const transiciones = TRANSICIONES_ESTADO[mascota.estado];

  async function aplicar(estado: EstadoMascota) {
    if (estado === "PERDIDA" && !mostrarPerdida) {
      setMostrarPerdida(true);
      return;
    }

    setCargando(true);
    setError(null);
    setMensaje(null);

    const resultado = await cambiarEstadoMascota(mascota.id, estado, {
      notas,
      lugarPerdida: estado === "PERDIDA" ? lugar : undefined,
      fechaPerdida: estado === "PERDIDA" ? fecha : undefined,
    });

    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setMensaje(resultado.mensaje);
    setMostrarPerdida(false);
    router.refresh();
  }

  return (
    <div className="tarjeta-panel">
      <h2>Estado actual</h2>
      <div style={{ marginBottom: "1rem" }}>
        <BadgeEstadoMascota estado={mascota.estado} />
      </div>

      {esFichaPublica(mascota.estado) && (
        <p style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
          <Link href={`/mascota/${mascota.slug}`} target="_blank">
            Ver ficha pública →
          </Link>
        </p>
      )}

      {mensaje && <p className="auth-alerta auth-alerta--ok">{mensaje}</p>}
      {error && <p className="auth-alerta auth-alerta--error">{error}</p>}

      {mostrarPerdida && (
        <div style={{ marginBottom: "1rem" }}>
          <div className="form-group">
            <label>Lugar de pérdida *</label>
            <input
              type="text"
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              placeholder="Ej: Jr. Moquegua, Puno"
            />
          </div>
          <div className="form-group">
            <label>Fecha y hora</label>
            <input
              type="datetime-local"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="form-group">
        <label>Notas (opcional)</label>
        <input
          type="text"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Detalle del cambio de estado"
        />
      </div>

      <div className="panel-estados">
        {transiciones.map((estado) => (
          <button
            key={estado}
            type="button"
            className="btn-estado"
            disabled={cargando}
            onClick={() => aplicar(estado)}
          >
            {ACCIONES[estado]?.label ?? ETIQUETAS_ESTADO[estado]}
          </button>
        ))}
      </div>
    </div>
  );
}
