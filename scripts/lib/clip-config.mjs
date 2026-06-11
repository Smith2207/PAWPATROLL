/**
 * Constantes CLIP compartidas con src/lib/visual/config.ts (mantener alineadas).
 */
export const MODELO_CLIP = "openai/clip-vit-base-patch32";

export const DIMENSION_CLIP = 512;

export const MODELO_XENOVA_LOCAL =
  process.env.CLIP_MODEL?.trim() || "Xenova/clip-vit-base-patch32";
