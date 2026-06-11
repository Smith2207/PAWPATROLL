/**
 * API REST (/api/chat/adjunto/[id]): endpoint chat › adjunto › [id].
 */
import { auth } from "@/auth";
import { puedeAccederChatAvistamiento } from "@/actions/chat";
import { db } from "@/lib/db";
import { mensajesAvistamiento } from "@/lib/db/schema";
import { leerAdjuntoChatBlob, esUrlBlobChat } from "@/lib/storage/blob-chat";
import { verificarRateLimit } from "@/lib/api/rate-limit";
import { dataUrlABuffer } from "@/lib/visual/data-url";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const bloqueado = verificarRateLimit(req, "chat-adjunto", 60);
  if (bloqueado) return bloqueado;

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

  try {
    const { buffer, mime } = dataUrlABuffer(mensaje.adjuntoUrl);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=86400, immutable",
      },
    });
  } catch {
    return new Response("Adjunto inválido", { status: 404 });
  }
}
