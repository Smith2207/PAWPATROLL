/** Clave de Maps Platform (Geocoding, Geolocation, Places). */
export function claveGoogleMaps(): string | null {
  const k =
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  return k || null;
}

export function mapsGoogleDisponible(): boolean {
  return claveGoogleMaps() != null;
}

export type ResultadoBusquedaLugar = {
  lat: number;
  lng: number;
  etiqueta: string;
};

type GeocodeGoogle = {
  results?: Array<{
    formatted_address?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
  }>;
  status?: string;
};

export async function reverseGeocodeGoogle(
  lat: number,
  lng: number
): Promise<string | null> {
  const key = claveGoogleMaps();
  if (!key) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("key", key);
  url.searchParams.set("language", "es");
  url.searchParams.set("region", "pe");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;

  const data = (await res.json()) as GeocodeGoogle;
  if (data.status !== "OK" || !data.results?.[0]) return null;

  return data.results[0].formatted_address?.trim() || null;
}

export async function buscarLugaresGoogle(
  consulta: string
): Promise<ResultadoBusquedaLugar[]> {
  const key = claveGoogleMaps();
  if (!key) return [];

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", consulta);
  url.searchParams.set("components", "country:PE");
  url.searchParams.set("key", key);
  url.searchParams.set("language", "es");
  url.searchParams.set("region", "pe");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return [];

  const data = (await res.json()) as GeocodeGoogle;
  if (data.status !== "OK" || !data.results?.length) return [];

  return data.results
    .map((r) => {
      const lat = r.geometry?.location?.lat;
      const lng = r.geometry?.location?.lng;
      if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
      }
      return {
        lat,
        lng,
        etiqueta: r.formatted_address?.trim() || consulta,
      };
    })
    .filter((r): r is ResultadoBusquedaLugar => r != null)
    .slice(0, 6);
}

/** Respaldo cuando el GPS del navegador falla (usa red/IP vía Google). */
export async function geolocalizarGoogleRespaldo(): Promise<{
  lat: number;
  lng: number;
  precisionMetros: number;
} | null> {
  const key = claveGoogleMaps();
  if (!key) return null;

  const res = await fetch(
    `https://www.googleapis.com/geolocation/v1/geolocate?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
    }
  );

  if (!res.ok) return null;

  const data = (await res.json()) as {
    location?: { lat?: number; lng?: number };
    accuracy?: number;
  };

  const lat = data.location?.lat;
  const lng = data.location?.lng;
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat,
    lng,
    precisionMetros: Math.max(data.accuracy ?? 500, 100),
  };
}
