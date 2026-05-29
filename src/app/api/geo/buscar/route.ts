import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 3) {
    return NextResponse.json({ resultados: [] });
  }

  try {
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
      next: { revalidate: 300 },
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

    return NextResponse.json({ resultados });
  } catch {
    return NextResponse.json(
      { error: "Error al buscar en el mapa." },
      { status: 502 }
    );
  }
}
