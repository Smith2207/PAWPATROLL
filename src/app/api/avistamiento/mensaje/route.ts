import { enviarMensajeAvistamiento } from "@/actions/avistamientos";

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
      if (!archivo.type.startsWith("image/")) {
        return Response.json(
          { ok: false, error: "Solo se permiten imágenes." },
          { status: 400 }
        );
      }
      if (archivo.size > MAX_ARCHIVO) {
        return Response.json(
          { ok: false, error: "La imagen no puede superar 4 MB." },
          { status: 400 }
        );
      }
      const buf = Buffer.from(await archivo.arrayBuffer());
      const mime = archivo.type || "image/jpeg";
      adjuntoUrl = `data:${mime};base64,${buf.toString("base64")}`;
      if (adjuntoUrl.length > MAX_DATA_URL) {
        return Response.json(
          { ok: false, error: "La imagen es demasiado pesada. Prueba con otra más pequeña." },
          { status: 400 }
        );
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
