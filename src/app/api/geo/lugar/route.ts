/**
 * API REST (/api/geo/lugar): endpoint geo › lugar.
 */
import { NextResponse } from "next/server";
import { resolverLugarGoogle } from "@/lib/geo/proveedor-maps";
import { ipDesdeRequest, rateLimit, respuestaRateLimit } from "@/lib/api/rate-limit";

export async function GET(request: Request) {
  const ip = ipDesdeRequest(request);
  const limite = rateLimit(`geo-lugar:${ip}`, 30, 60_000);
  if (!limite.ok) return respuestaRateLimit(limite.reintentarEnSeg);

  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("place_id")?.trim() ?? "";
  const etiqueta = searchParams.get("etiqueta")?.trim();
  const subtitulo = searchParams.get("subtitulo")?.trim();

  if (!placeId) {
    return NextResponse.json({ error: "Falta place_id." }, { status: 400 });
  }

  try {
    const lugar = await resolverLugarGoogle(placeId, {
      etiqueta: etiqueta || "Lugar seleccionado",
      subtitulo,
    });
    if (!lugar) {
      return NextResponse.json(
        { error: "No se pudo obtener el lugar." },
        { status: 404 }
      );
    }

    return NextResponse.json({ lugar, proveedor: "google" });
  } catch {
    return NextResponse.json(
      { error: "Error al resolver el lugar." },
      { status: 500 }
    );
  }
}
