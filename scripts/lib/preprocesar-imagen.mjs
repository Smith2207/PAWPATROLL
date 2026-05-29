const TAMANO = 224;

export function parseDataUrl(dataUrl) {
  const m = /^data:image\/([\w+.-]+);base64,(.+)$/i.exec(dataUrl);
  if (!m) throw new Error("Data URL inválido");
  return Buffer.from(m[2], "base64");
}

export async function preprocesarDataUrlParaClip(dataUrl) {
  try {
    const sharp = (await import("sharp")).default;
    const buffer = parseDataUrl(dataUrl);
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
