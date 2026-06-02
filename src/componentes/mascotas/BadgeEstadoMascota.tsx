import { Icono } from "@/componentes/ui/Icono";
import type { EstadoMascota } from "@/lib/db/schema";
import { BADGE_ESTADO, ETIQUETAS_ESTADO } from "@/lib/mascotas/estados";

export function BadgeEstadoMascota({ estado }: { estado: EstadoMascota }) {
  const badge = BADGE_ESTADO[estado];
  return (
    <span className={`estado-badge ${badge.clase}`}>
      <Icono nombre={badge.icono} size={14} />
      {ETIQUETAS_ESTADO[estado]}
    </span>
  );
}
