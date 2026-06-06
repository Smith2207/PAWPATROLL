export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { mascotas } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ipDesdeRequest, rateLimit, respuestaRateLimit } from "@/lib/api/rate-limit";

export async function POST(req: Request) {
  const ip = ipDesdeRequest(req);
  const limite = rateLimit(`ia-indexar:${ip}`, 10, 60_000);
  if (!limite.ok) return respuestaRateLimit(limite.reintentarEnSeg);

  const sesion = await auth();
  const userId = sesion?.user?.id;
  if (!userId) {
    return Response.json({ ok: false, error: "Debes iniciar sesión." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { mascotaId?: string };
    const mascotaId = body.mascotaId?.trim();
    if (!mascotaId) {
      return Response.json(
        { ok: false, error: "Falta mascotaId." },
        { status: 400 }
      );
    }

    const [mascota] = await db
      .select({ userId: mascotas.userId })
      .from(mascotas)
      .where(eq(mascotas.id, mascotaId))
      .limit(1);

    if (!mascota) {
      return Response.json({ ok: false, error: "Mascota no encontrada." }, { status: 404 });
    }

    const esAdmin = sesion.user?.rol === "ADMINISTRADOR";
    if (!esAdmin && mascota.userId !== userId) {
      return Response.json({ ok: false, error: "No autorizado." }, { status: 403 });
    }

    const { sincronizarEmbeddingMascota } = await import(
      "@/lib/visual/indice-visual"
    );
    const resultado = await sincronizarEmbeddingMascota(mascotaId);
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
