/** Referencias usadas para calibrar radios y consejos (M5). */

export type FuenteComportamiento = {
  id: string;
  titulo: string;
  autores?: string;
  anio?: number;
  url: string;
  nota: string;
};

export const FUENTES_COMPORTAMIENTO: FuenteComportamiento[] = [
  {
    id: "huang-2018-gatos",
    titulo:
      "Search Methods Used to Locate Missing Cats and Locations Where Missing Cats Are Found",
    autores: "Huang et al.",
    anio: 2018,
    url: "https://www.researchgate.net/publication/322239789_Search_Methods_Used_to_Locate_Missing_Cats_and_Locations_Where_Missing_Cats_Are_Found",
    nota: "~75% de gatos encontrados dentro de 500 m; gatos solo interior mediana ~137 m; con acceso exterior hasta ~1,6 km en parte de los casos.",
  },
  {
    id: "lord-2007-perros-gatos",
    titulo: "Search and identification methods that owners use to find a lost dog or cat",
    autores: "Lord et al.",
    anio: 2007,
    url: "https://lostpetresearch.com/2019/03/lost-pet-statistics/",
    nota: "Búsqueda física en el vecindario y regreso por cuenta propia son vías frecuentes de recuperación.",
  },
  {
    id: "mar-gatos",
    titulo: "Missing Cat Study — Missing Animal Response Network",
    autores: "Kat Albrecht / MAR",
    url: "https://www.missinganimalresponse.com/missing-cat-study/",
    nota: "Muchos gatos se ocultan muy cerca (propiedad vecina, debajo de estructuras); búsqueda sistemática en radios cortos.",
  },
];

/** Metros — Huang et al. 2018 */
export const EVIDENCIA = {
  GATO_INTERIOR_MEDIANA_M: 137,
  GATO_INTERIOR_P75_M: 200,
  GATO_MIXTO_RADIO_P75_M: 500,
  GATO_EXTERIOR_P75_VIAJE_M: 1609,
  GATO_RECUPERADO_7_DIAS_PCT: 34,
  PERRO_PEQUEÑO_BASE_M: 600,
  PERRO_MEDIANO_BASE_M: 1200,
  PERRO_GRANDE_BASE_M: 2000,
  PERRO_INTERIOR_FACTOR: 0.55,
  /** Primeras 72 h: priorizar radio corto (gatos) */
  HORAS_CRITICAS: 72,
  /** Tras ~90 días la probabilidad de hallazgo vivo cae mucho (gatos) */
  DIAS_BAJA_PROBABILIDAD_GATO: 90,
} as const;
