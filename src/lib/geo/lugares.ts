import { subtituloDesdePartes } from "@/lib/geo/partes-ubicacion";

/** Resultado de búsqueda de dirección o lugar (Google Autocomplete o Nominatim). */
export type ResultadoBusquedaLugar = {
  lat?: number;
  lng?: number;
  etiqueta: string;
  subtitulo?: string;
  placeId?: string;
};

export function lugarBusquedaConCoordenadas(
  lugar: ResultadoBusquedaLugar
): lugar is ResultadoBusquedaLugar & { lat: number; lng: number } {
  return Number.isFinite(lugar.lat) && Number.isFinite(lugar.lng);
}

export function lugarBusquedaUtilizable(lugar: ResultadoBusquedaLugar): boolean {
  return lugarBusquedaConCoordenadas(lugar) || Boolean(lugar.placeId?.trim());
}

export function etiquetaCompletaLugar(lugar: ResultadoBusquedaLugar): string {
  const principal = lugar.etiqueta.trim();
  const secundaria = lugar.subtitulo?.trim();
  if (secundaria && !principal.toLowerCase().includes(secundaria.toLowerCase())) {
    return `${principal}, ${secundaria}`;
  }
  return principal;
}

type DireccionNominatim = {
  amenity?: string;
  shop?: string;
  tourism?: string;
  building?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
};

export type ItemNominatim = {
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  address?: DireccionNominatim;
};

export function lugarDesdeNominatim(item: ItemNominatim): ResultadoBusquedaLugar | null {
  const lat = Number.parseFloat(item.lat);
  const lng = Number.parseFloat(item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const addr = item.address;
  const etiqueta =
    item.name?.trim() ||
    addr?.amenity?.trim() ||
    addr?.shop?.trim() ||
    addr?.tourism?.trim() ||
    addr?.building?.trim() ||
    item.display_name?.split(",")[0]?.trim() ||
    "Lugar";

  const subtitulo =
    subtituloDesdePartes(
      addr?.neighbourhood,
      addr?.suburb,
      addr?.city,
      addr?.town,
      addr?.village
    ) ?? addr?.road?.trim();

  return { lat, lng, etiqueta, subtitulo };
}
