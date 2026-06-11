/**
 * Permisos y acceso a reportes de avistamiento: validaciones.
 */
import type { UbicacionSeleccionada } from "@/lib/geo/tipos";
import { coordenadasValidas } from "@/lib/geo/tipos";

export const MSG_UBICACION_PERDIDA =
  "Marca en el mapa dónde se perdió (busca la dirección o usa Ubicarme).";

export const MSG_UBICACION_AVISTAMIENTO =
  "Marca en el mapa dónde la viste (busca la dirección o usa Ubicarme).";

export const MSG_UBICACION_CORTA_PERDIDA = "Marca en el mapa dónde se perdió.";

export const MSG_UBICACION_CORTA_AVISTAMIENTO =
  "Marca en el mapa dónde la viste.";

export function errorSiSinUbicacion(
  ubicacion: UbicacionSeleccionada | null,
  mensaje: string
): string | null {
  return coordenadasValidas(ubicacion) ? null : mensaje;
}
