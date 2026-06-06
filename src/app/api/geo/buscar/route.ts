import { NextResponse } from "next/server";
import { buscarLugaresGoogle } from "@/lib/geo/proveedor-maps";
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
    const google = await buscarLugaresGoogle(q);
    if (google.length > 0) {
      return NextResponse.json({ resultados: google, proveedor: "google" });
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("accept-language", "es");
    url.searchParams.set("countrycodes", "pe");
    url.searchParams.set("limit", "6");
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "PawPatroll/1.0 (app mascotas perdidas)",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "No se pudo buscar la dirección." },
        { status: 502 }
      );
    }

    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name?: string;
    }>;

    const resultados = data.map((item) => ({
      lat: Number.parseFloat(item.lat),
      lng: Number.parseFloat(item.lon),
      etiqueta: item.display_name ?? q,
    }));

    return NextResponse.json({ resultados, proveedor: "nominatim" });
  } catch {
    return NextResponse.json(
      { error: "Error al buscar en el mapa." },
      { status: 500 }
    );
  }
}
