import type { UbicacionPeru } from "@/lib/geo/ubigeo-peru";

export type { UbicacionPeru };

/** Búsqueda vía API interna (cliente). */
export async function buscarCiudadesDesdeApi(
  termino: string,
  limite = 12
): Promise<UbicacionPeru[]> {
  const params = new URLSearchParams({ q: termino });
  const respuesta = await fetch(`/api/ubigeo/buscar?${params}`);

  if (!respuesta.ok) {
    return [];
  }

  const json = (await respuesta.json()) as {
    ok: boolean;
    data?: UbicacionPeru[];
  };

  return json.ok && json.data ? json.data.slice(0, limite) : [];
}
