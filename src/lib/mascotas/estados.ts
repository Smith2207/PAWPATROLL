import type { EstadoMascota } from "@/lib/db/schema";

export const ETIQUETAS_ESTADO: Record<EstadoMascota, string> = {
  EN_CASA: "En casa",
  PERDIDA: "Perdida",
  ENCONTRADA: "Encontrada",
  REUNIDA: "Reunida con su familia",
};

export const BADGE_ESTADO: Record<
  EstadoMascota,
  { clase: string; emoji: string }
> = {
  EN_CASA: { clase: "estado-badge--casa", emoji: "🏠" },
  PERDIDA: { clase: "estado-badge--perdida", emoji: "🔴" },
  ENCONTRADA: { clase: "estado-badge--encontrada", emoji: "🟡" },
  REUNIDA: { clase: "estado-badge--reunida", emoji: "🟢" },
};

/** Visible en la ficha pública de la comunidad */
export function esFichaPublica(estado: EstadoMascota) {
  return estado === "PERDIDA" || estado === "ENCONTRADA";
}

export const TRANSICIONES_ESTADO: Record<EstadoMascota, EstadoMascota[]> = {
  EN_CASA: ["PERDIDA"],
  PERDIDA: ["ENCONTRADA", "REUNIDA", "EN_CASA"],
  ENCONTRADA: ["REUNIDA", "PERDIDA", "EN_CASA"],
  REUNIDA: ["EN_CASA"],
};
