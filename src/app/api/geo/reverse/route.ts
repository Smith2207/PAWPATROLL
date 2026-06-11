/**
 * API REST (/api/geo/reverse): endpoint geo › reverse.
 */
import { NextResponse } from "next/server";
import { reverseGeocodeGoogle } from "@/lib/geo/proveedor-maps";
import { ipDesdeRequest, rateLimit, respuestaRateLimit } from "@/lib/api/rate-limit";

export async function GET(request: Request) {
  const ip = ipDesdeRequest(request);
  const limite = rateLimit(`geo-reverse:${ip}`, 40, 60_000);
  if (!limite.ok) return respuestaRateLimit(limite.reintentarEnSeg);

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Faltan lat y lng." }, { status: 400 });
  }

  const latN = Number.parseFloat(lat);
  const lngN = Number.parseFloat(lng);
  if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
    return NextResponse.json({ error: "Coordenadas inválidas." }, { status: 400 });
  }

  try {
    const google = await reverseGeocodeGoogle(latN, lngN);
    if (google) {
      return NextResponse.json({ direccion: google, proveedor: "google" });
    }

    const precisionParam = searchParams.get("precision");
    const precisionN = precisionParam ? Number.parseFloat(precisionParam) : null;
    const zoom =
      precisionN != null && Number.isFinite(precisionN) && precisionN <= 30
        ? "19"
        : precisionN != null && Number.isFinite(precisionN) && precisionN <= 80
          ? "18"
          : "17";

    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(latN));
    url.searchParams.set("lon", String(lngN));
    url.searchParams.set("format", "json");
    url.searchParams.set("accept-language", "es");
    url.searchParams.set("zoom", zoom);

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "PawPatroll/1.0 (app mascotas perdidas)",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "No se pudo obtener la dirección." },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };

    let direccion = data.display_name ?? "";
    const a = data.address;
    if (a) {
      const partes = [
        a.road || a.pedestrian || a.footway,
        a.suburb || a.neighbourhood || a.quarter,
        a.city || a.town || a.village || a.municipality,
        a.state,
      ].filter(Boolean);
      if (partes.length > 0) {
        direccion = partes.join(", ");
      }
    }

    return NextResponse.json({
      direccion: direccion.trim() || null,
      proveedor: "nominatim",
    });
  } catch {
    return NextResponse.json(
      { error: "Error al consultar la dirección." },
      { status: 500 }
    );
  }
}
