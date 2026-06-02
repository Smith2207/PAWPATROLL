"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  actualizarEstadoReporteAbuso,
  type ResultadoAdmin,
} from "@/actions/admin";
import { Icono } from "@/componentes/ui/Icono";
import Link from "next/link";

type Reporte = {
  id: string;
  motivo: string;
  estado: string;
  createdAt: Date;
  avistamientoId: string;
  numeroReporte: number;
  nombreMascota: string | null;
  reportante: string | null;
  reportanteEmail: string;
};

type Props = {
  reportes: Reporte[];
};

function etiquetaEstado(estado: string) {
  if (estado === "RESUELTO") return { clase: "admin-badge--ok", texto: "Resuelto" };
  if (estado === "DESCARTADO") return { clase: "admin-badge--muted", texto: "Descartado" };
  return { clase: "admin-badge--alerta", texto: "Pendiente" };
}

export function ModeracionReportes({ reportes: iniciales }: Props) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function actuar(id: string, estado: "RESUELTO" | "DESCARTADO") {
    setMensaje(null);
    setError(null);
    startTransition(async () => {
      let resultado: ResultadoAdmin;
      try {
        resultado = await actualizarEstadoReporteAbuso(id, estado);
      } catch {
        setError("No se pudo actualizar el reporte.");
        return;
      }
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setMensaje(resultado.mensaje ?? "Actualizado.");
      router.refresh();
    });
  }

  if (iniciales.length === 0) {
    return <p className="admin-vacio">Sin reportes registrados.</p>;
  }

  return (
    <>
      {mensaje && <p className="admin-flash admin-flash--ok">{mensaje}</p>}
      {error && <p className="admin-flash admin-flash--error">{error}</p>}
      <div className="admin-tabla-wrap">
        <table className="admin-tabla">
          <thead>
            <tr>
              <th>Avistamiento</th>
              <th>Mascota</th>
              <th>Reportó</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {iniciales.map((r) => {
              const badge = etiquetaEstado(r.estado);
              return (
                <tr key={r.id}>
                  <td>
                    <Link href={`/avistamiento/${r.avistamientoId}`}>
                      #{r.numeroReporte}
                    </Link>
                  </td>
                  <td>{r.nombreMascota ?? "—"}</td>
                  <td>{r.reportante ?? r.reportanteEmail}</td>
                  <td>
                    {r.motivo.slice(0, 80)}
                    {r.motivo.length > 80 ? "…" : ""}
                  </td>
                  <td>
                    <span className={`admin-badge ${badge.clase}`}>{badge.texto}</span>
                  </td>
                  <td>
                    {new Date(r.createdAt).toLocaleString("es-PE", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>
                    {r.estado === "PENDIENTE" ? (
                      <div className="admin-acciones-fila">
                        <button
                          type="button"
                          className="admin-btn admin-btn--ok"
                          disabled={pendiente}
                          onClick={() => actuar(r.id, "RESUELTO")}
                        >
                          <Icono nombre="checkCirculo" size={14} />
                          Resolver
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--muted"
                          disabled={pendiente}
                          onClick={() => actuar(r.id, "DESCARTADO")}
                        >
                          Descartar
                        </button>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
