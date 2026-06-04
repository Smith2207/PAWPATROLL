/** Zoom de mapa acorde a la precisión del GPS (metros). */
export function zoomMapaParaPrecision(precisionMetros?: number): number {
  if (!precisionMetros || !Number.isFinite(precisionMetros)) return 17;
  if (precisionMetros <= 15) return 18;
  if (precisionMetros <= 40) return 17;
  if (precisionMetros <= 100) return 16;
  return 15;
}

export function textoPrecisionGps(precisionMetros?: number): string | null {
  if (!precisionMetros || !Number.isFinite(precisionMetros)) return null;
  const m = Math.round(precisionMetros);
  if (m <= 25) return null;
  return `Precisión aproximada ±${m} m. Toca el mapa si necesitas afinar el punto.`;
}
