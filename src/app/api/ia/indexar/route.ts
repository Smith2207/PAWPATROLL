import { sincronizarEmbeddingMascota } from "@/lib/visual/indice-visual";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { mascotaId?: string };
    if (!body.mascotaId?.trim()) {
      return Response.json(
        { ok: false, error: "Falta mascotaId." },
        { status: 400 }
      );
    }
    const resultado = await sincronizarEmbeddingMascota(body.mascotaId.trim());
    return Response.json(resultado, { status: resultado.ok ? 200 : 422 });
  } catch (e) {
    return Response.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Error interno.",
      },
      { status: 500 }
    );
  }
}
