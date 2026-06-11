import { NextResponse } from "next/server";
import { buscarLugares } from "@/lib/geo/proveedor-maps";
import { ipDesdeRequest, rateLimit, respuestaRateLimit } from "@/lib/api/rate-limit";

export async function GET(request: Request) {
  const ip = ipDesdeRequest(request);
  const limite = rateLimit(`geo-buscar:${ip}`, 40, 60_000);
  if (!limite.ok) return respuestaRateLimit(limite.reintentarEnSeg);

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 3) {
    return NextResponse.json({ resultados: [] });
  }

  try {
    const { resultados, proveedor } = await buscarLugares(q);
    return NextResponse.json({ resultados, proveedor });
  } catch {
    return NextResponse.json(
      { error: "Error al buscar en el mapa." },
      { status: 500 }
    );
  }
}
