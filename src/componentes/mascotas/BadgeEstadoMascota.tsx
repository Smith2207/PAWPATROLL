import type { EstadoMascota } from "@/lib/db/schema";
import { BADGE_ESTADO, ETIQUETAS_ESTADO } from "@/lib/mascotas/estados";

export function BadgeEstadoMascota({ estado }: { estado: EstadoMascota }) {
  const badge = BADGE_ESTADO[estado];
  return (
    <span className={`estado-badge ${badge.clase}`}>
      {badge.emoji} {ETIQUETAS_ESTADO[estado]}
    </span>
  );
}
