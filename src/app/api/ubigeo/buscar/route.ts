import { buscarUbicacionesPeru } from "@/lib/geo/ubigeo-peru";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
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
