/**
 * Acceso a conversaciones de chat.
 *
 * Cada conversación está ligada 1:1 a un reporte (`mensaje_avistamiento.avistamiento_id`).
 * Mismas reglas que el reporte: el dueño ve todos los hilos de su mascota;
 * el reportante solo el de su propio avistamiento.
 */
export {
  puedeAccederReporte as puedeAccederConversacion,
  obtenerContextoReporte,
  type ContextoReporte,
} from "@/lib/reportes/acceso";
