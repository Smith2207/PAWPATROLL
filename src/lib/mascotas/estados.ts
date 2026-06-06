import type { EstadoMascota } from "@/lib/db/schema";
import type { NombreIcono } from "@/componentes/ui/Icono";

export const ETIQUETAS_ESTADO: Record<EstadoMascota, string> = {
  EN_CASA: "En casa",
  PERDIDA: "Perdida",
  ENCONTRADA: "Encontrada",
  REUNIDA: "Reunida con su familia",
};

export const BADGE_ESTADO: Record<
  EstadoMascota,
  { clase: string; icono: NombreIcono }
> = {
  EN_CASA: { clase: "estado-badge--casa", icono: "casa" },
  PERDIDA: { clase: "estado-badge--perdida", icono: "alertaCirculo" },
  ENCONTRADA: { clase: "estado-badge--encontrada", icono: "alerta" },
  REUNIDA: { clase: "estado-badge--reunida", icono: "checkCirculo" },
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
