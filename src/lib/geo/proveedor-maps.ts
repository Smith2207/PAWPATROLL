/**
 * Geolocalización y mapas: proveedor-maps.
 */
import {
  etiquetaGeocodeConConsulta,
  etiquetaLegibleGeocodeGoogle,
  etiquetaYNombreDesdeGoogle,
  formatearDireccionGoogle,
  limpiarSubtituloAutocomplete,
  resultadoGooglePareceUtil,
  type ResultadoGeocodeGoogle,
} from "@/lib/geo/formatear-direccion-google";
import {
  lugarDesdeNominatim,
  type ItemNominatim,
  type ResultadoBusquedaLugar,
} from "@/lib/geo/lugares";

export type { ResultadoBusquedaLugar };

const NOMINATIM_USER_AGENT = "PawPatroll/1.0 (app mascotas perdidas)";

function claveGoogleMaps(): string | null {
  return process.env.GOOGLE_MAPS_API_KEY?.trim() || null;
}

type GeocodeGoogle = {
  results?: Array<
    ResultadoGeocodeGoogle & {
      geometry?: { location?: { lat?: number; lng?: number } };
      place_id?: string;
    }
  >;
  status?: string;
};

type PlacesAutocomplete = {
  predictions?: Array<{
    place_id?: string;
    description?: string;
    structured_formatting?: {
      main_text?: string;
      secondary_text?: string;
    };
  }>;
  status?: string;
};

type PlaceDetails = {
  result?: {
    name?: string;
    formatted_address?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
  };
  status?: string;
};

type PistaLugar = Pick<ResultadoBusquedaLugar, "etiqueta" | "subtitulo">;

function coordenadasDeGeometry(
  geometry?: { location?: { lat?: number; lng?: number } }
): { lat: number; lng: number } | null {
  const lat = geometry?.location?.lat;
  const lng = geometry?.location?.lng;
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lng };
}

function lugarDesdeGeocode(
  r: NonNullable<GeocodeGoogle["results"]>[number],
  consulta: string
): ResultadoBusquedaLugar | null {
  const coords = coordenadasDeGeometry(r.geometry);
  if (!coords) return null;
  const { lat, lng } = coords;

  const desdeConsulta = etiquetaGeocodeConConsulta(consulta, r);
  const etiqueta =
    desdeConsulta?.etiqueta ||
    etiquetaLegibleGeocodeGoogle(r) ||
    (r.formatted_address
      ? formatearDireccionGoogle(r.formatted_address)
      : consulta);

  return {
    lat,
    lng,
    etiqueta,
    subtitulo: desdeConsulta?.subtitulo,
    placeId: r.place_id?.trim(),
  };
}

async function fetchGoogle<T>(url: URL): Promise<T | null> {
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

/** Desplegable como Google Maps (Autocomplete). */
async function buscarAutocomplete(
  consulta: string,
  key: string
): Promise<ResultadoBusquedaLugar[]> {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/autocomplete/json"
  );
  url.searchParams.set("input", consulta);
  url.searchParams.set("components", "country:pe");
  url.searchParams.set("key", key);
  url.searchParams.set("language", "es");

  const data = await fetchGoogle<PlacesAutocomplete>(url);
  if (data?.status !== "OK" || !data.predictions?.length) return [];

  const resultados: ResultadoBusquedaLugar[] = [];
  for (const p of data.predictions.slice(0, 6)) {
    const placeId = p.place_id?.trim();
    if (!placeId) continue;

    resultados.push({
      placeId,
      etiqueta:
        p.structured_formatting?.main_text?.trim() ||
        p.description?.trim() ||
        consulta,
      subtitulo: limpiarSubtituloAutocomplete(
        p.structured_formatting?.secondary_text?.trim() ?? ""
      ),
    });
  }
  return resultados;
}

/** Respaldo para direcciones cuando Autocomplete no encuentra nada. */
async function buscarGeocode(
  consulta: string,
  key: string
): Promise<ResultadoBusquedaLugar[]> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", consulta);
  url.searchParams.set("components", "country:PE");
  url.searchParams.set("key", key);
  url.searchParams.set("language", "es");
  url.searchParams.set("region", "pe");

  const data = await fetchGoogle<GeocodeGoogle>(url);
  if (data?.status !== "OK" || !data.results?.length) return [];

  return data.results
    .map((r) => lugarDesdeGeocode(r, consulta))
    .filter((r): r is ResultadoBusquedaLugar => r != null)
    .filter((r) => resultadoGooglePareceUtil(consulta, r))
    .slice(0, 6);
}

async function geocodePorPlaceId(
  placeId: string,
  key: string,
  pista?: PistaLugar
): Promise<ResultadoBusquedaLugar | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("key", key);
  url.searchParams.set("language", "es");

  const data = await fetchGoogle<GeocodeGoogle>(url);
  const r = data?.results?.[0];
  if (data?.status !== "OK" || !r) return null;

  const coords = coordenadasDeGeometry(r.geometry);
  if (!coords) return null;
  const { lat, lng } = coords;

  const { etiqueta, subtitulo } = etiquetaYNombreDesdeGoogle(
    null,
    r.formatted_address,
    pista
  );

  return { lat, lng, etiqueta, subtitulo, placeId };
}

export async function resolverLugarGoogle(
  placeId: string,
  pista?: PistaLugar
): Promise<ResultadoBusquedaLugar | null> {
  const key = claveGoogleMaps();
  const id = placeId.trim();
  if (!key || !id) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", id);
  url.searchParams.set("fields", "geometry,name,formatted_address");
  url.searchParams.set("key", key);
  url.searchParams.set("language", "es");

  const data = await fetchGoogle<PlaceDetails>(url);
  if (data?.status === "OK" && data.result) {
    const coords = coordenadasDeGeometry(data.result.geometry);
    if (coords) {
      const { etiqueta, subtitulo } = etiquetaYNombreDesdeGoogle(
        data.result.name,
        data.result.formatted_address,
        pista
      );
      return { ...coords, etiqueta, subtitulo, placeId: id };
    }
  }

  return geocodePorPlaceId(id, key, pista);
}

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

  const data = await fetchGoogle<GeocodeGoogle>(url);
  const r = data?.results?.[0];
  if (data?.status !== "OK" || !r) return null;

  return (
    etiquetaLegibleGeocodeGoogle(r) ||
    (r.formatted_address
      ? formatearDireccionGoogle(r.formatted_address)
      : null)
  );
}

export async function buscarLugaresGoogle(
  consulta: string
): Promise<ResultadoBusquedaLugar[]> {
  const key = claveGoogleMaps();
  if (!key) return [];

  const autocomplete = await buscarAutocomplete(consulta, key);
  if (autocomplete.length > 0) return autocomplete;

  return buscarGeocode(consulta, key);
}

async function buscarNominatim(consulta: string): Promise<ResultadoBusquedaLugar[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", consulta);
  url.searchParams.set("format", "json");
  url.searchParams.set("accept-language", "es");
  url.searchParams.set("countrycodes", "pe");
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": NOMINATIM_USER_AGENT,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) return [];

  const data = (await res.json()) as ItemNominatim[];
  return data
    .map((item) => lugarDesdeNominatim(item))
    .filter((r): r is ResultadoBusquedaLugar => r != null);
}

function zoomNominatimReverse(precisionMetros: number | null | undefined): string {
  if (
    precisionMetros != null &&
    Number.isFinite(precisionMetros) &&
    precisionMetros <= 30
  ) {
    return "19";
  }
  if (
    precisionMetros != null &&
    Number.isFinite(precisionMetros) &&
    precisionMetros <= 80
  ) {
    return "18";
  }
  return "17";
}

function direccionDesdeNominatimReverse(data: {
  display_name?: string;
  address?: Record<string, string>;
}): string {
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
  return direccion.trim();
}

/** Reverse geocoding con OpenStreetMap Nominatim (fallback sin Google). */
export async function reverseGeocodeNominatim(
  lat: number,
  lng: number,
  precisionMetros?: number | null
): Promise<string | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("accept-language", "es");
  url.searchParams.set("zoom", zoomNominatimReverse(precisionMetros));

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": NOMINATIM_USER_AGENT,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    display_name?: string;
    address?: Record<string, string>;
  };

  const direccion = direccionDesdeNominatimReverse(data);
  return direccion || null;
}

/** Google primero; si no hay clave o falla, Nominatim. */
export async function reverseGeocode(
  lat: number,
  lng: number,
  precisionMetros?: number | null
): Promise<{ direccion: string | null; proveedor: "google" | "nominatim" | "ninguno" }> {
  const google = await reverseGeocodeGoogle(lat, lng);
  if (google) {
    return { direccion: google, proveedor: "google" };
  }

  const nominatim = await reverseGeocodeNominatim(lat, lng, precisionMetros);
  if (nominatim) {
    return { direccion: nominatim, proveedor: "nominatim" };
  }

  return { direccion: null, proveedor: "ninguno" };
}

/** Google Autocomplete → Geocoding → OpenStreetMap. */
export async function buscarLugares(
  consulta: string
): Promise<{ resultados: ResultadoBusquedaLugar[]; proveedor: string }> {
  const google = await buscarLugaresGoogle(consulta);
  if (google.length > 0) {
    return { resultados: google, proveedor: "google" };
  }

  const nominatim = await buscarNominatim(consulta);
  if (nominatim.length > 0) {
    return { resultados: nominatim, proveedor: "nominatim" };
  }

  return { resultados: [], proveedor: "ninguno" };
}
