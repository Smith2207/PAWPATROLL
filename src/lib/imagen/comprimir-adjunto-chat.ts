/**
 * Procesamiento y validación de imágenes: comprimir-adjunto-chat.
 */
import sharp from "sharp";
import {
  MAX_BYTES_DATA_URL_IMAGEN,
  MAX_BYTES_IMAGEN_USUARIO,
  validarArchivoImagen,
} from "@/lib/imagen/validar-archivo";
import {
  blobChatDisponible,
  subirAdjuntoChatBlob,
} from "@/lib/storage/blob-chat";

const MAX_BYTES = 850_000;

const MENSAJE_DATA_URL_SIN_BLOB =
  "La imagen es demasiado pesada. Configura BLOB_READ_WRITE_TOKEN o usa otra más pequeña.";

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

/** Valida, comprime y sube (Blob) o codifica (data URL) un adjunto de chat. */
export async function adjuntoChatDesdeArchivo(
  archivo: File,
  contextoId: string
): Promise<
  { ok: true; url: string } | { ok: false; error: string; status: number }
> {
  const validacion = validarArchivoImagen(archivo, {
    maxBytes: MAX_BYTES_IMAGEN_USUARIO,
  });
  if (!validacion.ok) {
    return { ok: false, error: validacion.error, status: 400 };
  }

  const buf = Buffer.from(await archivo.arrayBuffer());
  const { buffer, mime } = await comprimirAdjuntoChat(buf, archivo.type);

  if (blobChatDisponible()) {
    const url = await subirAdjuntoChatBlob(contextoId, buffer, mime);
    return { ok: true, url };
  }

  const url = adjuntoDataUrl(buffer, mime);
  if (url.length > MAX_BYTES_DATA_URL_IMAGEN) {
    return { ok: false, error: MENSAJE_DATA_URL_SIN_BLOB, status: 400 };
  }

  return { ok: true, url };
}
