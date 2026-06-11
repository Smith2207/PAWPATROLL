/**
 * API REST (/api/geo/lugar): endpoint geo › lugar.
 */
import { jsonError, jsonErrorInterno } from "@/lib/api/respuestas";
import { verificarRateLimit } from "@/lib/api/rate-limit";
import { resolverLugarGoogle } from "@/lib/geo/proveedor-maps";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const bloqueado = verificarRateLimit(request, "geo-lugar", 30);
  if (bloqueado) return bloqueado;

  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("place_id")?.trim() ?? "";
  const etiqueta = searchParams.get("etiqueta")?.trim();
  const subtitulo = searchParams.get("subtitulo")?.trim();

  if (!placeId) {
    return jsonError("Falta place_id.");
  }

  try {
    const lugar = await resolverLugarGoogle(placeId, {
      etiqueta: etiqueta || "Lugar seleccionado",
      subtitulo,
    });
    if (!lugar) {
      return jsonError("No se pudo obtener el lugar.", 404);
    }

    return NextResponse.json({ lugar, proveedor: "google" });
  } catch {
    return jsonErrorInterno("Error al resolver el lugar.");
  }
}
