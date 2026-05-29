/** Paleta: un color por mascota perdida (cerco, pin, avistamientos y ruta). */

export type EstiloFamiliaMascota = {
  color: string;
  fillColor: string;
};

const PALETA: EstiloFamiliaMascota[] = [
  { color: "#ea580c", fillColor: "#fb923c" },
  { color: "#2563eb", fillColor: "#60a5fa" },
  { color: "#dc2626", fillColor: "#f87171" },
  { color: "#7c3aed", fillColor: "#a78bfa" },
  { color: "#059669", fillColor: "#34d399" },
  { color: "#db2777", fillColor: "#f472b6" },
  { color: "#ca8a04", fillColor: "#facc15" },
  { color: "#0891b2", fillColor: "#22d3ee" },
];

export const COLOR_AVISTAMIENTO_SIN_VINCULO = "#64748b";

export function estiloFamiliaPorIndice(indice: number): EstiloFamiliaMascota {
  return PALETA[((indice % PALETA.length) + PALETA.length) % PALETA.length];
}

/** Índice estable por orden de la lista de perdidas activas. */
export function mapaEstilosPorMascota(
  perdidaIds: string[]
): Map<string, EstiloFamiliaMascota> {
  const mapa = new Map<string, EstiloFamiliaMascota>();
  perdidaIds.forEach((id, i) => {
    mapa.set(id, estiloFamiliaPorIndice(i));
  });
  return mapa;
}

/** @deprecated usar estiloFamiliaPorIndice */
export const estiloCercoPorIndice = estiloFamiliaPorIndice;
