export type Coordenadas = {
  lat: number;
  lng: number;
};

export type UbicacionSeleccionada = Coordenadas & {
  etiqueta?: string;
  /** Precisión del GPS en metros (si está disponible) */
  precisionMetros?: number;
};

/** Centro por defecto: Puno, Perú */
export const CENTRO_MAPA_DEFECTO: Coordenadas = {
  lat: -15.8402,
  lng: -70.0219,
};

export function parsearCoordenada(valor: string | null | undefined): number | null {
  if (valor == null || valor === "") return null;
  const n = Number.parseFloat(valor);
  return Number.isFinite(n) ? n : null;
}

export function coordenadasValidas(c: Coordenadas | null | undefined): c is Coordenadas {
  if (!c) return false;
  return (
    Number.isFinite(c.lat) &&
    Number.isFinite(c.lng) &&
    c.lat >= -90 &&
    c.lat <= 90 &&
    c.lng >= -180 &&
    c.lng <= 180
  );
}

export function formatearCoordenadas(c: Coordenadas, decimales = 5): string {
  return `${c.lat.toFixed(decimales)}, ${c.lng.toFixed(decimales)}`;
}
