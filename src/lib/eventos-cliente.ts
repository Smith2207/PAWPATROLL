/** Eventos CustomEvent del cliente (evita typos entre dispatch y listeners). */

export const EVENTO_REPORTE_PUBLICADO = "pawpatroll:reporte-publicado";

/** Pide al mapa comunitario recentrar en la ubicación del usuario. */
export const EVENTO_CENTRAR_MAPA_USUARIO = "pawpatroll:centrar-mapa-usuario";

export function emitirReportePublicado() {
  window.dispatchEvent(new CustomEvent(EVENTO_REPORTE_PUBLICADO));
}

export function emitirCentrarMapaUsuario() {
  window.dispatchEvent(new CustomEvent(EVENTO_CENTRAR_MAPA_USUARIO));
}
