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

export type ResultadoGeolocalizarGoogle =
  | { ok: true; lat: number; lng: number; precisionMetros: number }
  | { ok: false; error: string; detalle?: string };

function mensajeGeolocalizacionGoogle(
  statusHttp: number,
  cuerpo: { error?: { message?: string; status?: string } }
): string {
  const msg = cuerpo.error?.message ?? "";
  const estado = cuerpo.error?.status ?? "";

  if (
    estado === "PERMISSION_DENIED" ||
    msg.includes("referer") ||
    msg.includes("referrer")
  ) {
    return "La API key tiene restricción de sitio web. Para Ubicarme en el servidor, quita «Referentes HTTP» o usa una key solo para backend (restricción por IP o sin restricción de app).";
  }
  if (
    msg.includes("not enabled") ||
    msg.includes("has not been used") ||
    msg.includes("Geolocation")
  ) {
    return "Activa Geolocation API en Google Cloud y espera 1–2 minutos.";
  }
  if (msg.includes("billing") || msg.includes("Billing")) {
    return "Activa la facturación en tu proyecto de Google Cloud (Maps requiere cuenta de facturación).";
  }
  if (msg.includes("API key not valid") || msg.includes("invalid")) {
    return "GOOGLE_MAPS_API_KEY no es válida. Revisa la clave en .env.local.";
  }
  if (statusHttp === 403) {
    return "Google rechazó la key (403). Revisa APIs habilitadas y restricciones.";
  }
  if (msg) return msg;
  return "Google no pudo estimar tu ubicación.";
}

/** Respaldo cuando el GPS del navegador falla (usa red/IP vía Google). */
export async function geolocalizarGoogleRespaldo(): Promise<ResultadoGeolocalizarGoogle> {
  const key = claveGoogleMaps();
  if (!key) {
    return { ok: false, error: "Falta GOOGLE_MAPS_API_KEY en el servidor." };
  }

  const res = await fetch(
    `https://www.googleapis.com/geolocation/v1/geolocate?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ considerIp: true }),
      cache: "no-store",
    }
  );

  const data = (await res.json()) as {
    location?: { lat?: number; lng?: number };
    accuracy?: number;
    error?: { message?: string; status?: string };
  };

  if (!res.ok || data.error) {
    return {
      ok: false,
      error: mensajeGeolocalizacionGoogle(res.status, data),
      detalle: data.error?.message,
    };
  }

  const lat = data.location?.lat;
  const lng = data.location?.lng;
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      ok: false,
      error: "Google respondió sin coordenadas válidas.",
      detalle: JSON.stringify(data),
    };
  }

  return {
    ok: true,
    lat,
    lng,
    precisionMetros: Math.max(data.accuracy ?? 500, 100),
  };
}
