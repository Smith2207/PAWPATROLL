/**
 * Utilidades del mapa Leaflet: filtrar-por-mascota.
 */
import type { DatosMapaPublico } from "@/actions/mapa";

/** Garantiza que el mapa solo muestre datos de una mascota (defensa en cliente). */
export function datosMapaDeUnaMascota(
  datos: DatosMapaPublico,
  mascotaId: string
): DatosMapaPublico {
  const avistamientos = datos.avistamientos.filter(
    (a) => a.mascotaId === mascotaId
  );
  const perdidas = datos.perdidas.filter((p) => p.id === mascotaId);

  const puntosCalor: [number, number, number][] = avistamientos.map((a) => [
    a.lat,
    a.lng,
    0.6 + Math.min(a.numeroReporte, 5) * 0.08,
  ]);

  for (const p of perdidas) {
    puntosCalor.push([p.lat, p.lng, 0.85]);
  }

  if (datos.prediccion) {
    for (const z of datos.prediccion.zonasRefugio) {
      puntosCalor.push([z.lat, z.lng, z.probabilidad * 0.5]);
    }
  }

  return {
    perdidas,
    avistamientos,
    puntosCalor,
    prediccion: datos.prediccion,
  };
}
