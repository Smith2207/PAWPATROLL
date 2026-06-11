import {
  lugarBusquedaConCoordenadas,
  lugarBusquedaUtilizable,
  type ResultadoBusquedaLugar,
} from "@/lib/geo/lugares";

export type { ResultadoBusquedaLugar };

/** Busca una dirección escrita (ej. Jr. Lima, Puno) y devuelve coincidencias. */
export async function buscarLugaresPorTexto(
  consulta: string
): Promise<ResultadoBusquedaLugar[]> {
  const q = consulta.trim();
  if (q.length < 3) return [];

  try {
    const res = await fetch(
      `/api/geo/buscar?q=${encodeURIComponent(q)}`
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { resultados?: ResultadoBusquedaLugar[] };
    return (data.resultados ?? []).filter(lugarBusquedaUtilizable);
  } catch {
    return [];
  }
}

/** Obtiene coordenadas de una sugerencia de Autocomplete (place_id). */
export async function resolverLugarPorPlaceId(
  placeId: string,
  pista?: Pick<ResultadoBusquedaLugar, "etiqueta" | "subtitulo">
): Promise<ResultadoBusquedaLugar | null> {
  const id = placeId.trim();
  if (!id) return null;

  try {
    const params = new URLSearchParams({ place_id: id });
    if (pista?.etiqueta?.trim()) {
      params.set("etiqueta", pista.etiqueta.trim());
    }
    if (pista?.subtitulo?.trim()) {
      params.set("subtitulo", pista.subtitulo.trim());
    }
    const res = await fetch(`/api/geo/lugar?${params.toString()}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { lugar?: ResultadoBusquedaLugar };
    const lugar = data.lugar;
    if (!lugar || !lugarBusquedaConCoordenadas(lugar)) return null;
    return lugar;
  } catch {
    return null;
  }
}

/** Convierte coordenadas en dirección legible (estilo mapas). */
export async function obtenerDireccionDesdeCoords(
  lat: number,
  lng: number,
  precisionMetros?: number
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
    });
    if (precisionMetros != null && Number.isFinite(precisionMetros)) {
      params.set("precision", String(Math.round(precisionMetros)));
    }
    const res = await fetch(`/api/geo/reverse?${params.toString()}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { direccion?: string | null };
    return data.direccion?.trim() || null;
  } catch {
    return null;
  }
}
