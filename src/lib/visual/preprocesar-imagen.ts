/**
 * Búsqueda visual por foto (embeddings Gemini/CLIP): preprocesar-imagen.
 */
import { dataUrlABuffer } from "@/lib/visual/data-url";

/** Entrada estándar ViT-B/32 (CLIP) */
const TAMANO_CLIP = 224;

/**
 * Recorte centrado 224×224 + JPEG para que CLIP compare mejor.
 * Si sharp no carga (p. ej. build nativo pendiente), devuelve la imagen original.
 */
export async function preprocesarDataUrlParaClip(
  dataUrl: string
): Promise<string> {
  try {
    const sharp = (await import("sharp")).default;
    const { buffer } = dataUrlABuffer(dataUrl);
    const procesada = await sharp(buffer)
      .rotate()
      .resize(TAMANO_CLIP, TAMANO_CLIP, { fit: "cover", position: "centre" })
      .jpeg({ quality: 92 })
      .toBuffer();
    return `data:image/jpeg;base64,${procesada.toString("base64")}`;
  } catch {
    return dataUrl;
  }
}
