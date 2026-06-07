/**
 * Fuente compartida de enrutamiento WS (Railway + Next.js hub).
 * Mantener sincronizado con src/lib/tiempo-real/tipos.ts
 */

/** @param {Record<string, unknown> & { tipo: string }} evento */
export function canalesParaEvento(evento) {
  const canales = ["mapa"];
  if (evento.mascotaId) canales.push(`mascota:${evento.mascotaId}`);
  if (evento.avistamientoId) canales.push(`avistamiento:${evento.avistamientoId}`);
  if (evento.tipo === "notificacion:nueva" && evento.userId) {
    canales.push(`usuario:${evento.userId}`);
  }
  if (evento.tipo === "mensaje:nuevo" && evento.destinatarioUserId) {
    canales.push(`usuario:${evento.destinatarioUserId}`);
  }
  if (evento.tipo === "chat:leido" && evento.destinatarioUserId) {
    canales.push(`usuario:${evento.destinatarioUserId}`);
  }
  return [...new Set(canales)];
}
