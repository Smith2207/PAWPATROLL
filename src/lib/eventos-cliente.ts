/** Eventos CustomEvent del cliente (evita typos entre dispatch y listeners). */

export const EVENTO_REPORTE_PUBLICADO = "pawpatroll:reporte-publicado";

export function emitirReportePublicado() {
  window.dispatchEvent(new CustomEvent(EVENTO_REPORTE_PUBLICADO));
}
