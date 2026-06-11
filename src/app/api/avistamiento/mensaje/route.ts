/**
 * API REST (/api/avistamiento/mensaje): endpoint avistamiento › mensaje.
 */
import { enviarMensajeAvistamiento } from "@/actions/avistamientos";
import {
  adjuntoDataUrl,
  comprimirAdjuntoChat,
} from "@/lib/imagen/comprimir-adjunto-chat";
import { validarArchivoImagen } from "@/lib/imagen/validar-archivo";
import {
  blobChatDisponible,
  subirAdjuntoChatBlob,
} from "@/lib/storage/blob-chat";

const MAX_ARCHIVO = 4 * 1024 * 1024;
const MAX_DATA_URL = 900_000;

export async function POST(req: Request) {
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
      const validacion = validarArchivoImagen(archivo, { maxBytes: MAX_ARCHIVO });
      if (!validacion.ok) {
        return Response.json({ ok: false, error: validacion.error }, { status: 400 });
      }
      const buf = Buffer.from(await archivo.arrayBuffer());
      const { buffer, mime } = await comprimirAdjuntoChat(buf, archivo.type);

      if (blobChatDisponible()) {
        adjuntoUrl = await subirAdjuntoChatBlob(avistamientoId, buffer, mime);
      } else {
        adjuntoUrl = adjuntoDataUrl(buffer, mime);
        if (adjuntoUrl.length > MAX_DATA_URL) {
          return Response.json(
            {
              ok: false,
              error:
                "La imagen es demasiado pesada. Configura BLOB_READ_WRITE_TOKEN o usa otra más pequeña.",
            },
            { status: 400 }
          );
        }
      }
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
