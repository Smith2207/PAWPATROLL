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
