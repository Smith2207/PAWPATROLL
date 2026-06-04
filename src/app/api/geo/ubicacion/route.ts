import { NextResponse } from "next/server";
import {
  geolocalizarGoogleRespaldo,
  mapsGoogleDisponible,
} from "@/lib/geo/proveedor-maps";

/** Respaldo de ubicación vía Google Geolocation API (cuando falla el GPS del navegador). */
export async function POST() {
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
    const punto = await geolocalizarGoogleRespaldo();
    if (!punto) {
      return NextResponse.json(
        { ok: false, error: "Google no pudo estimar tu ubicación." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      lat: punto.lat,
      lng: punto.lng,
      precisionMetros: punto.precisionMetros,
      origen: "google-geolocation",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Error al consultar Google Geolocation." },
      { status: 500 }
    );
  }
}
