/**
 * Librería (storage): blob-chat.
 */
import { get, put } from "@vercel/blob";

const EXT_POR_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function blobChatDisponible(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/** URL guardada en BD (Vercel Blob privado). */
export function esUrlBlobChat(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const u = url.trim();
  return (
    u.includes(".blob.vercel-storage.com/") ||
    u.includes(".public.blob.vercel-storage.com/")
  );
}

export function esAdjuntoChatValido(url: string): boolean {
  const u = url.trim();
  return u.startsWith("data:image/") || esUrlBlobChat(u);
}

/** Sube imagen de chat a blob privado. Requiere BLOB_READ_WRITE_TOKEN. */
export async function subirAdjuntoChatBlob(
  avistamientoId: string,
  buffer: Buffer,
  mime: string
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN no configurado.");
  }

  const ext = EXT_POR_MIME[mime] ?? "jpg";
  const pathname = `chat/${avistamientoId}/${crypto.randomUUID()}.${ext}`;

  const blob = await put(pathname, buffer, {
    access: "private",
    contentType: mime,
    token,
  });

  return blob.url;
}

/** Lee bytes de un adjunto en blob privado (solo servidor). */
export async function leerAdjuntoChatBlob(url: string): Promise<{
  buffer: Buffer;
  mime: string;
} | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token || !esUrlBlobChat(url)) return null;

  const resultado = await get(url, { access: "private", token });
  if (!resultado?.stream) return null;

  const buffer = Buffer.from(await new Response(resultado.stream).arrayBuffer());
  const mime =
    resultado.blob.contentType ||
    resultado.blob.contentDisposition?.match(/image\/[\w+.-]+/)?.[0] ||
    "image/jpeg";

  return { buffer, mime };
}
