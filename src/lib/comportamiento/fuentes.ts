/** Referencias usadas para calibrar radios, refugios y consejos (M5). */

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
    autores: "Huang, Coradini & Rand",
    anio: 2018,
    url: "https://www.mdpi.com/2076-2613/8/5/78",
    nota: "Estudio observacional en gatos perdidos: ~75 % se encontraron dentro de 500 m; gatos de interior mediana ~137 m; acceso exterior amplía el radio de desplazamiento.",
  },
  {
    id: "lord-2007-perros-gatos",
    titulo:
      "Search and identification methods that owners use to find a lost dog or cat",
    autores: "Lord, Wittum & Ferketich",
    anio: 2007,
    url: "https://pubmed.ncbi.nlm.nih.gov/17603017/",
    nota: "Encuesta a dueños en Ohio: la búsqueda física en el vecindario y el regreso espontáneo son vías frecuentes; subraya ventanas críticas de búsqueda activa.",
  },
  {
    id: "lord-2009-perros",
    titulo:
      "Search and identification methods to find lost dogs and characteristics of recovering dogs",
    autores: "Lord, Haar & Witte",
    anio: 2009,
    url: "https://pubmed.ncbi.nlm.nih.gov/19678807/",
    nota: "Perros recuperados: muchos permanecen cerca del hogar; la señalización y la búsqueda callejera mejoran hallazgos en las primeras 48–72 h.",
  },
  {
    id: "mar-gatos",
    titulo: "Missing Cat Study — Missing Animal Response Network",
    autores: "Kat Albrecht / MAR",
    url: "https://www.missinganimalresponse.com/missing-cat-study/",
    nota: "Gatos asustados suelen ocultarse a pocos metros (jardines vecinos, garajes, estructuras bajas); búsqueda sistemática en radios cortos y de noche.",
  },
  {
    id: "albrecht-2015",
    titulo: "Pet Tracker Protocol and lost pet recovery (Missing Animal Response)",
    autores: "Kat Albrecht",
    anio: 2015,
    url: "https://www.missinganimalresponse.com/",
    nota: "Protocolos de búsqueda por especie: perros pueden recorrer más terreno; gatos tienden a refugiarse cerca del punto de escape.",
  },
];

/** Metros y umbrales — calibrados con Huang et al. 2018 y Lord et al. 2007/2009 */
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
