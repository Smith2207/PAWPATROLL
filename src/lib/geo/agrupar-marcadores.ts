/**
 * Geolocalización y mapas: agrupar-marcadores.
 */
import { distanciaMetros } from "@/lib/geo/distancia";

type ConCoordenadas = { id: string; lat: number; lng: number };

/** Agrupa marcadores a menos de `umbralMetros` (transitivo simple). */
export function agruparMarcadoresCercanos<T extends ConCoordenadas>(
  items: T[],
  umbralMetros = 45
): T[][] {
  const grupos: T[][] = [];
  const usados = new Set<string>();

  for (const item of items) {
    if (usados.has(item.id)) continue;

    const grupo: T[] = [item];
    usados.add(item.id);

    let cambio = true;
    while (cambio) {
      cambio = false;
      for (const otro of items) {
        if (usados.has(otro.id)) continue;
        const cercaDelGrupo = grupo.some(
          (g) =>
            distanciaMetros(g.lat, g.lng, otro.lat, otro.lng) < umbralMetros
        );
        if (cercaDelGrupo) {
          grupo.push(otro);
          usados.add(otro.id);
          cambio = true;
        }
      }
    }

    grupos.push(grupo);
  }

  return grupos;
}

export function centroideGrupo<T extends { lat: number; lng: number }>(
  grupo: T[]
): { lat: number; lng: number } {
  if (grupo.length === 0) return { lat: 0, lng: 0 };
  const lat = grupo.reduce((s, p) => s + p.lat, 0) / grupo.length;
  const lng = grupo.reduce((s, p) => s + p.lng, 0) / grupo.length;
  return { lat, lng };
}
