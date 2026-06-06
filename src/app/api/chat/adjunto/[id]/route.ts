import { auth } from "@/auth";
import { puedeAccederChatAvistamiento } from "@/actions/casos";
import { db } from "@/lib/db";
import { mensajesAvistamiento } from "@/lib/db/schema";
import { leerAdjuntoChatBlob, esUrlBlobChat } from "@/lib/storage/blob-chat";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

function parsearDataUrl(dataUrl: string) {
  const match = /^data:(image\/[\w+.-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(
    dataUrl.trim()
  );
  if (!match) return null;
  return { mime: match[1], buffer: Buffer.from(match[2], "base64") };
}

export async function GET(_req: Request, { params }: Params) {
  const sesion = await auth();
  if (!sesion?.user?.id) {
    return new Response("No autorizado", { status: 401 });
  }

  const { id } = await params;
  const [mensaje] = await db
    .select({
      adjuntoUrl: mensajesAvistamiento.adjuntoUrl,
      avistamientoId: mensajesAvistamiento.avistamientoId,
    })
    .from(mensajesAvistamiento)
    .where(eq(mensajesAvistamiento.id, id))
    .limit(1);

  if (!mensaje?.adjuntoUrl) {
    return new Response("No encontrado", { status: 404 });
  }

  const acceso = await puedeAccederChatAvistamiento(mensaje.avistamientoId);
  if (!acceso) {
    return new Response("No autorizado", { status: 403 });
  }

  if (esUrlBlobChat(mensaje.adjuntoUrl)) {
    const blob = await leerAdjuntoChatBlob(mensaje.adjuntoUrl);
    if (!blob) {
      return new Response("Adjunto no disponible", { status: 404 });
    }
    return new Response(new Uint8Array(blob.buffer), {
      headers: {
        "Content-Type": blob.mime,
        "Cache-Control": "private, max-age=86400, immutable",
      },
    });
  }

  const parsed = parsearDataUrl(mensaje.adjuntoUrl);
  if (!parsed) {
    return new Response("Adjunto inválido", { status: 404 });
  }

  return new Response(new Uint8Array(parsed.buffer), {
    headers: {
      "Content-Type": parsed.mime,
      "Cache-Control": "private, max-age=86400, immutable",
    },
  });
}
