export type ResultadoBusquedaLugar = {
  lat: number;
  lng: number;
  etiqueta: string;
};

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
    return (data.resultados ?? []).filter(
      (r) => Number.isFinite(r.lat) && Number.isFinite(r.lng)
    );
  } catch {
    return [];
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
