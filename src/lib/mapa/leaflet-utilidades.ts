/**
 * Utilidades del mapa Leaflet: leaflet-utilidades.
 */
import L from "leaflet";
import "leaflet.heat";

/** Gradiente compartido entre mapa público y panel admin. */
export const GRADIENTE_MAPA_CALOR: Record<number, string> = {
  0.2: "#3b82f6",
  0.5: "#eab308",
  0.8: "#f97316",
  1: "#ef4444",
};

export const OPCIONES_CALOR_MAPA_PUBLICO = {
  radius: 28,
  blur: 22,
  maxZoom: 17,
  gradient: GRADIENTE_MAPA_CALOR,
} as const;

export const OPCIONES_CALOR_MAPA_ADMIN = {
  radius: 32,
  blur: 24,
  maxZoom: 17,
  gradient: GRADIENTE_MAPA_CALOR,
} as const;

export type OpcionesCapaCalor = {
  radius?: number;
  blur?: number;
  maxZoom?: number;
  gradient?: Record<number, string>;
};

/** Evita IndexSizeError cuando Leaflet redibuja con contenedor aún en 0×0. */
export function contenedorMapaVisible(
  contenedor: HTMLElement | null | undefined
): boolean {
  if (!contenedor?.isConnected) return false;
  const { width, height } = contenedor.getBoundingClientRect();
  return width >= 1 && height >= 1;
}

export function invalidarTamanoMapaSeguro(
  mapa: L.Map,
  contenedor?: HTMLElement | null
) {
  const el = contenedor ?? mapa.getContainer();
  if (!el?.isConnected) return;
  const { width, height } = el.getBoundingClientRect();
  if (width < 1 || height < 1) return;
  try {
    mapa.invalidateSize();
  } catch {
    /* contenedor oculto o sin layout */
  }
}

/** leaflet.heat falla con IndexSizeError si el canvas del mapa mide 0×0. */
export function agregarCapaCalorSegura(
  mapa: L.Map,
  contenedor: HTMLElement | null | undefined,
  puntos: [number, number, number?][],
  opciones: OpcionesCapaCalor = OPCIONES_CALOR_MAPA_PUBLICO
): L.Layer | null {
  if (puntos.length === 0 || !contenedorMapaVisible(contenedor)) return null;
  try {
    invalidarTamanoMapaSeguro(mapa, contenedor);
    return L.heatLayer(puntos, {
      ...OPCIONES_CALOR_MAPA_PUBLICO,
      ...opciones,
    }).addTo(mapa);
  } catch {
    return null;
  }
}
