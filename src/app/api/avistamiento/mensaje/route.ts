/**
 * API REST (/api/avistamiento/mensaje): endpoint avistamiento › mensaje.
 */
import { enviarMensajeAvistamiento } from "@/actions/avistamientos";
import { adjuntoChatDesdeArchivo } from "@/lib/imagen/comprimir-adjunto-chat";
import { verificarRateLimit } from "@/lib/api/rate-limit";

export async function POST(req: Request) {
  const bloqueado = verificarRateLimit(req, "avistamiento-mensaje", 25);
  if (bloqueado) return bloqueado;

  try {
    const fd = await req.formData();
    const avistamientoId = fd.get("avistamientoId")?.toString()?.trim();
    const contenido = fd.get("contenido")?.toString() ?? "";
    const archivo = fd.get("imagen");

    if (!avistamientoId) {
      return Response.json(
        { ok: false, error: "Falta el avistamiento." },
        { status: 400 }
      );
    }

    let adjuntoUrl: string | null = null;
    if (archivo instanceof File && archivo.size > 0) {
      const adjunto = await adjuntoChatDesdeArchivo(archivo, avistamientoId);
      if (!adjunto.ok) {
        return Response.json(
          { ok: false, error: adjunto.error },
          { status: adjunto.status }
        );
      }
      adjuntoUrl = adjunto.url;
    }

    const res = await enviarMensajeAvistamiento(
      avistamientoId,
      contenido,
      adjuntoUrl
    );
    return Response.json(res, { status: res.ok ? 200 : 400 });
  } catch (e) {
    console.error("[api/avistamiento/mensaje]", e);
    return Response.json(
      { ok: false, error: "No se pudo enviar el mensaje." },
      { status: 500 }
    );
  }
}
