/** Valores compartidos en fichas, modales y avistamientos. */

export const SEXOS = ["Macho", "Hembra"] as const;

export const TAMANOS = [
  "Pequeño (menos de 10 kg)",
  "Mediano (10–25 kg)",
  "Grande (más de 25 kg)",
] as const;

export type TamanoMascota = (typeof TAMANOS)[number];

export const DIRECCIONES_MOVIMIENTO = [
  "No lo noté",
  "Hacia el norte / parque",
  "Hacia el sur",
  "Hacia el este / mercado",
  "Hacia el oeste",
  "Se quedó en el lugar",
] as const;

export const PLACEHOLDER_UBICACION =
  "Ej: Jr. Lima 345, Parque Pino, Puno — escribe y pulsa buscar";
