/**
 * API REST (/api/ubigeo/buscar): endpoint ubigeo › buscar.
 */
import { buscarUbicacionesPeru } from "@/lib/geo/ubigeo-peru";
import { verificarRateLimit } from "@/lib/api/rate-limit";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const bloqueado = verificarRateLimit(request, "ubigeo-buscar", 30);
  if (bloqueado) return bloqueado;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ ok: true, data: [] });
  }

  try {
    const data = await buscarUbicacionesPeru(q, 12);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error al buscar ubicaciones.";
    return NextResponse.json(
      { ok: false, error: mensaje, data: [] },
      { status: 502 }
    );
  }
}
