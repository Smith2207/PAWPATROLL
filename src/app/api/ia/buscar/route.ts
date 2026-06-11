/**
 * API REST (/api/ia/buscar): endpoint ia › buscar.
 */
import type { FiltrosBusquedaVisual } from "@/lib/visual/rerank";
import {
  validarArchivoImagen,
  validarDataUrlImagen,
  MAX_BYTES_IMAGEN_USUARIO,
} from "@/lib/imagen/validar-archivo";
import { verificarRateLimit } from "@/lib/api/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Gemini: ~2–5 s. CLIP local (respaldo): primera vez ~1–2 min */
export const maxDuration = 120;

export async function POST(req: Request) {
  const bloqueado = verificarRateLimit(req, "ia-buscar", 20);
  if (bloqueado) return bloqueado;

  try {
    const ct = req.headers.get("content-type") ?? "";

    let dataUrl: string | null = null;
    let filtros: FiltrosBusquedaVisual | undefined;

    if (ct.includes("application/json")) {
      const body = (await req.json()) as {
        imagen?: string;
        foto?: string;
        tipoMascota?: string;
        color?: string;
        lat?: number;
        lng?: number;
      };
      dataUrl = body.imagen ?? body.foto ?? null;
      if (
        body.tipoMascota ||
        body.color ||
        (body.lat != null && body.lng != null)
      ) {
        filtros = {
          tipoMascota: body.tipoMascota,
          color: body.color,
          lat: body.lat,
          lng: body.lng,
        };
      }
    } else {
      const fd = await req.formData();
      const archivo = fd.get("imagen") ?? fd.get("foto");
      if (archivo instanceof File) {
        const validacion = validarArchivoImagen(archivo, {
          maxBytes: MAX_BYTES_IMAGEN_USUARIO,
        });
        if (!validacion.ok) {
          return Response.json({ ok: false, error: validacion.error }, { status: 400 });
        }
        const buf = Buffer.from(await archivo.arrayBuffer());
        const mime = archivo.type || "image/jpeg";
        dataUrl = `data:${mime};base64,${buf.toString("base64")}`;
      } else {
        const url = fd.get("dataUrl")?.toString();
        if (url?.startsWith("data:image/")) dataUrl = url;
      }
    }

    if (!dataUrl) {
      return Response.json(
        {
          ok: false,
          error: "Envía una imagen (multipart imagen/foto o JSON { imagen: dataUrl }).",
        },
        { status: 400 }
      );
    }

    const okData = validarDataUrlImagen(dataUrl);
    if (!okData.ok) {
      return Response.json({ ok: false, error: okData.error }, { status: 400 });
    }

    const { buscarSimilaresPorFoto } = await import("@/lib/visual/indice-visual");
    const resultado = await buscarSimilaresPorFoto(dataUrl, 8, filtros);
    const status = resultado.ok ? 200 : 503;
    return Response.json(resultado, { status });
  } catch (e) {
    console.error("[api/ia/buscar]", e);
    return Response.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Error interno.",
      },
      { status: 500 }
    );
  }
}
