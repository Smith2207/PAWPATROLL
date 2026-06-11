/**
 * Script auxiliar (CLI): preprocesar-imagen.
 */
import { dataUrlABuffer } from "./data-url.mjs";

const TAMANO = 224;

export async function preprocesarDataUrlParaClip(dataUrl) {
  try {
    const sharp = (await import("sharp")).default;
    const { buffer } = dataUrlABuffer(dataUrl);
    const out = await sharp(buffer)
      .rotate()
      .resize(TAMANO, TAMANO, { fit: "cover", position: "centre" })
      .jpeg({ quality: 92 })
      .toBuffer();
    return `data:image/jpeg;base64,${out.toString("base64")}`;
  } catch {
    return dataUrl;
  }
}
