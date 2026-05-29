"use client";

import { useModales } from "@/contexto/ContextoModales";

type Props = {
  mascotaId: string;
  nombre: string;
  tipo?: string;
  color?: string | null;
  raza?: string | null;
  className?: string;
  children?: React.ReactNode;
};

export function BotonReportarAvistamiento({
  mascotaId,
  nombre,
  tipo,
  color,
  raza,
  className = "ficha-publica-cta",
  children = "👁️ Reportar avistamiento",
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
      {children}
    </button>
  );
}
