/**
 * Librería (storage): blob-mascota.
 */
import { put } from "@vercel/blob";
import { dataUrlABuffer } from "@/lib/visual/data-url";

const EXT_POR_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function blobMascotaDisponible(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function esUrlBlobMascota(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const u = url.trim();
  return u.includes(".blob.vercel-storage.com/");
}

function dataUrlImagenABuffer(dataUrl: string): { buffer: Buffer; mime: string } | null {
  try {
    const { buffer, mime } = dataUrlABuffer(dataUrl.trim());
    return { buffer, mime };
  } catch {
    return null;
  }
}

/** Sube foto de ficha a blob público (ficha pública y listados). */
export async function subirFotoMascotaBlob(
  mascotaId: string,
  buffer: Buffer,
  mime: string
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN no configurado.");
  }

  const ext = EXT_POR_MIME[mime] ?? "jpg";
  const pathname = `mascotas/${mascotaId}/${crypto.randomUUID()}.${ext}`;

  const blob = await put(pathname, buffer, {
    access: "public",
    contentType: mime,
    token,
  });

  return blob.url;
}

/** Convierte data URLs a blob público cuando hay token; conserva URLs ya remotas. */
export async function normalizarFotosMascota(
  mascotaId: string,
  fotos: string[]
): Promise<string[]> {
  if (!blobMascotaDisponible()) return fotos;

  const resultado: string[] = [];
  for (const url of fotos) {
    if (esUrlBlobMascota(url) || url.startsWith("http")) {
      resultado.push(url);
      continue;
    }
    if (!url.startsWith("data:image/")) {
      resultado.push(url);
      continue;
    }
    const parsed = dataUrlImagenABuffer(url);
    if (!parsed) {
      resultado.push(url);
      continue;
    }
    const blobUrl = await subirFotoMascotaBlob(
      mascotaId,
      parsed.buffer,
      parsed.mime
    );
    resultado.push(blobUrl);
  }
  return resultado;
}
