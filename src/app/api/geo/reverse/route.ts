/**
 * API REST (/api/geo/reverse): endpoint geo › reverse.
 */
import { jsonError, jsonErrorInterno } from "@/lib/api/respuestas";
import { verificarRateLimit } from "@/lib/api/rate-limit";
import { reverseGeocode } from "@/lib/geo/proveedor-maps";
import {
  coordenadasDesdeValores,
  precisionMetrosDesdeParam,
} from "@/lib/geo/tipos";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const bloqueado = verificarRateLimit(request, "geo-reverse", 40);
  if (bloqueado) return bloqueado;

  const { searchParams } = new URL(request.url);
  const coords = coordenadasDesdeValores(
    searchParams.get("lat"),
    searchParams.get("lng")
  );

  if (!coords) {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (!lat || !lng) {
      return jsonError("Faltan lat y lng.");
    }
    return jsonError("Coordenadas inválidas.");
  }

  const precisionMetros = precisionMetrosDesdeParam(
    searchParams.get("precision")
  );

  try {
    const { direccion, proveedor } = await reverseGeocode(
      coords.lat,
      coords.lng,
      precisionMetros
    );

    if (proveedor === "ninguno") {
      return jsonError("No se pudo obtener la dirección.", 502);
    }

    return NextResponse.json({ direccion, proveedor });
  } catch {
    return jsonErrorInterno("Error al consultar la dirección.");
  }
}
