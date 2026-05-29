export function dataUrlABuffer(dataUrl: string): {
  buffer: Buffer;
  mime: string;
  extension: string;
} {
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
