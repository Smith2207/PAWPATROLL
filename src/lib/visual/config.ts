/**
 * Búsqueda visual por foto (embeddings Gemini/CLIP): config.
 */
import { join } from "path";
import { cwd } from "process";

/** Carpeta donde se descarga el ONNX (Transformers.js / Hugging Face Hub) */
export const CARPETA_CACHE_MODELO = join(cwd(), ".cache", "transformers");

/** Prompt compartido: Flash describe la mascota antes del embedding */
export const PROMPT_DESCRIPCION_MASCOTA_GEMINI = `Describe esta mascota (perro o gato) para búsqueda visual.
Incluye: especie, tamaño aproximado, colores del pelaje, patrones (atigrado, manchas), orejas, cola, señas visibles.
Responde en español, solo palabras clave separadas por comas, sin frases largas ni opiniones.`;

/** ID en disco; equivalente a openai/clip-vit-base-patch32 */
export const MODELO_CLIP = "openai/clip-vit-base-patch32";

export const DIMENSION_CLIP = 512;

export const MODELO_XENOVA_LOCAL =
  process.env.CLIP_MODEL?.trim() || "Xenova/clip-vit-base-patch32";

export function umbralesVisual() {
  return {
    minCoseno: Number(
      process.env.VISUAL_MIN_COSENO ?? process.env.CLIP_MIN_COSENO ?? "0.58"
    ),
    gapMinimo: Number(
      process.env.VISUAL_GAP_MINIMO ?? process.env.CLIP_GAP_MINIMO ?? "0.03"
    ),
    maxFotosPorMascota: Math.min(
      10,
      Math.max(
        1,
        Number(
          process.env.VISUAL_MAX_FOTOS_INDEX ??
            process.env.CLIP_MAX_FOTOS_INDEX ??
            "5"
        )
      )
    ),
    radioKmRerank: Number(
      process.env.VISUAL_RADIO_KM ?? process.env.CLIP_RADIO_KM ?? "25"
    ),
    bonusTipo: 0.03,
    bonusColor: 0.02,
    bonusCerca: 0.04,
    bonusCercaMedio: 0.02,
  };
}
