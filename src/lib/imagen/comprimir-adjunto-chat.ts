import sharp from "sharp";

const MAX_BYTES = 850_000;

/** Comprime una imagen de chat para guardar en BD (JPEG, máx. ~850 KB). */
export async function comprimirAdjuntoChat(
  buffer: Buffer,
  mimeOriginal?: string
): Promise<{ buffer: Buffer; mime: string }> {
  let calidad = 82;
  let salida = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({
      width: 1280,
      height: 1280,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: calidad, mozjpeg: true })
    .toBuffer();

  while (salida.length > MAX_BYTES && calidad > 48) {
    calidad -= 8;
    salida = await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize({
        width: 1024,
        height: 1024,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: calidad, mozjpeg: true })
      .toBuffer();
  }

  if (salida.length > MAX_BYTES && mimeOriginal?.startsWith("image/")) {
    return { buffer, mime: mimeOriginal };
  }

  return { buffer: salida, mime: "image/jpeg" };
}

export function adjuntoDataUrl(buffer: Buffer, mime: string): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}
