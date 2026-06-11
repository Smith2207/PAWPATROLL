/**
 * Constantes Gemini compartidas con src/lib/visual/config.ts (mantener alineadas).
 */
export const MODELO_GEMINI_VISION =
  process.env.GEMINI_VISION_MODEL?.trim() || "gemini-2.5-flash";

export const MODELO_GEMINI_EMBEDDING =
  process.env.GEMINI_EMBEDDING_MODEL?.trim() ||
  "gemini-embedding-2-preview";

export const PROMPT_DESCRIPCION_MASCOTA_GEMINI = `Describe esta mascota (perro o gato) para búsqueda visual.
Incluye: especie, tamaño aproximado, colores del pelaje, patrones (atigrado, manchas), orejas, cola, señas visibles.
Responde en español, solo palabras clave separadas por comas, sin frases largas ni opiniones.`;
