import { join } from "path";
import { cwd } from "process";

/** Carpeta donde se descarga el ONNX (Transformers.js / Hugging Face Hub) */
export const CARPETA_CACHE_MODELO = join(cwd(), ".cache", "transformers");

/** ID en disco; equivalente a openai/clip-vit-base-patch32 */
export const MODELO_XENOVA_LOCAL =
  process.env.CLIP_MODEL?.trim() || "Xenova/clip-vit-base-patch32";

export function umbralesClip() {
  return {
    minCoseno: Number(process.env.CLIP_MIN_COSENO ?? "0.58"),
    gapMinimo: Number(process.env.CLIP_GAP_MINIMO ?? "0.03"),
    maxFotosPorMascota: Math.min(
      10,
      Math.max(1, Number(process.env.CLIP_MAX_FOTOS_INDEX ?? "5"))
    ),
    radioKmRerank: Number(process.env.CLIP_RADIO_KM ?? "25"),
    bonusTipo: 0.03,
    bonusColor: 0.02,
    bonusCerca: 0.04,
    bonusCercaMedio: 0.02,
  };
}
