import type { UbicacionSeleccionada } from "@/lib/geo/tipos";

export const ETIQUETA_GPS = "Tu ubicación actual";
export const ETIQUETA_MAPA = "Punto marcado en el mapa";

/** Detecta textos tipo "-15.84020, -70.02190" para no mostrarlos al usuario. */
export function pareceCoordenadas(texto: string): boolean {
  return /^-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+/.test(texto.trim());
}

export function etiquetaVisibleUbicacion(
  ubicacion: UbicacionSeleccionada | null | undefined
): string {
  if (!ubicacion) return "";
  const t = ubicacion.etiqueta?.trim();
  if (t && !pareceCoordenadas(t)) return t;
  return ETIQUETA_MAPA;
}

export function ubicacionConEtiqueta(
  coords: { lat: number; lng: number },
  etiqueta: string
): UbicacionSeleccionada {
  return { ...coords, etiqueta };
}
