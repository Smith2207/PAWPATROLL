/**
 * API REST (/api/geo/buscar): endpoint geo › buscar.
 */
import { NextResponse } from "next/server";
import { jsonErrorInterno } from "@/lib/api/respuestas";
import { buscarLugares } from "@/lib/geo/proveedor-maps";
import { verificarRateLimit } from "@/lib/api/rate-limit";

export async function GET(request: Request) {
  const bloqueado = verificarRateLimit(request, "geo-buscar", 40);
  if (bloqueado) return bloqueado;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 3) {
    return NextResponse.json({ resultados: [] });
  }

  try {
    const { resultados, proveedor } = await buscarLugares(q);
    return NextResponse.json({ resultados, proveedor });
  } catch {
    return jsonErrorInterno("Error al buscar en el mapa.");
  }
}
