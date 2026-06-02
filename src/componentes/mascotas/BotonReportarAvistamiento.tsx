"use client";

import { useModales } from "@/contexto/ContextoModales";
import { Icono } from "@/componentes/ui/Icono";
import type { ReactNode } from "react";

type Props = {
  mascotaId: string;
  nombre: string;
  tipo?: string;
  color?: string | null;
  raza?: string | null;
  className?: string;
  children?: ReactNode;
};

export function BotonReportarAvistamiento({
  mascotaId,
  nombre,
  tipo,
  color,
  raza,
  className = "ficha-publica-cta",
  children,
}: Props) {
  const { abrirAvistamiento } = useModales();

  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        abrirAvistamiento({
          id: mascotaId,
          nombre,
          tipo,
          color,
          raza,
        })
      }
    >
      {children ?? (
        <>
          <Icono nombre="ojo" size={18} className="pp-icon--btn" />
          Reportar avistamiento
        </>
      )}
    </button>
  );
}
