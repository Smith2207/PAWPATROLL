import { put } from "@vercel/blob";

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

function parseDataUrl(dataUrl: string): { buffer: Buffer; mime: string } | null {
  const match = /^data:(image\/[\w+.-]+);base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) return null;
  try {
    return {
      mime: match[1]!,
      buffer: Buffer.from(match[2]!, "base64"),
    };
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
    const parsed = parseDataUrl(url);
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
