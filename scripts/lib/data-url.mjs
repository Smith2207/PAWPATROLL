/**
 * Parseo de data URL para scripts CLI (equivalente a src/lib/visual/data-url.ts).
 */
export function dataUrlABuffer(dataUrl) {
  const match = /^data:image\/([\w+.-]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    throw new Error("Data URL de imagen inválido.");
  }
  const subtype = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  const mime = `image/${subtype}`;
  const extension =
    subtype === "jpeg" || subtype === "jpg"
      ? "jpg"
      : subtype === "png"
        ? "png"
        : subtype === "webp"
          ? "webp"
          : "img";
  return { buffer, mime, extension };
}
