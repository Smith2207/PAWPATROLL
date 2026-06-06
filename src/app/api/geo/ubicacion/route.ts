import { NextResponse } from "next/server";
import {
  geolocalizarGoogleRespaldo,
  mapsGoogleDisponible,
} from "@/lib/geo/proveedor-maps";
import { ipDesdeRequest, rateLimit, respuestaRateLimit } from "@/lib/api/rate-limit";

/** Respaldo de ubicación vía Google Geolocation API (cuando falla el GPS del navegador). */
export async function POST(req: Request) {
  const ip = ipDesdeRequest(req);
  const limite = rateLimit(`geo-ubicacion:${ip}`, 15, 60_000);
  if (!limite.ok) return respuestaRateLimit(limite.reintentarEnSeg);

  if (!mapsGoogleDisponible()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Configura GOOGLE_MAPS_API_KEY y activa Geolocation API en Google Cloud.",
      },
      { status: 503 }
    );
  }

  try {
    const resultado = await geolocalizarGoogleRespaldo();

    if (!resultado.ok) {
      if (process.env.NODE_ENV === "development" && resultado.detalle) {
        console.warn("[geo/ubicacion]", resultado.detalle);
      }
      return NextResponse.json(
        {
          ok: false,
          error: resultado.error,
          ...(process.env.NODE_ENV === "development" && resultado.detalle
            ? { detalle: resultado.detalle }
            : {}),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      lat: resultado.lat,
      lng: resultado.lng,
      precisionMetros: resultado.precisionMetros,
      origen: "google-geolocation",
    });
  } catch (e) {
    console.error("[geo/ubicacion]", e);
    return NextResponse.json(
      { ok: false, error: "Error al consultar Google Geolocation." },
      { status: 500 }
    );
  }
}
