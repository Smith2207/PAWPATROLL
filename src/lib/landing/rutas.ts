/** Rutas públicas de la landing (una sección por página). */

export const RUTAS_LANDING = {
  inicio: "/",
  /** Listado + búsqueda de mascotas perdidas */
  casosActivos: "/casos-activos",
  comunidad: "/comunidad",
  comoFunciona: "/como-funciona",
} as const;

/** Redirección de anclas y rutas antiguas */
export const HASH_A_RUTA: Record<string, string> = {
  inicio: RUTAS_LANDING.inicio,
  buscar: RUTAS_LANDING.casosActivos,
  "casos-activos": RUTAS_LANDING.casosActivos,
  mapa: RUTAS_LANDING.comunidad,
  comunidad: RUTAS_LANDING.comunidad,
  "como-funciona": RUTAS_LANDING.comoFunciona,
};

export const ENLACES_NAV = [
  { href: RUTAS_LANDING.inicio, etiqueta: "Inicio" },
  { href: RUTAS_LANDING.casosActivos, etiqueta: "Casos activos" },
  { href: RUTAS_LANDING.comunidad, etiqueta: "Comunidad" },
  { href: RUTAS_LANDING.comoFunciona, etiqueta: "Cómo funciona" },
] as const;
