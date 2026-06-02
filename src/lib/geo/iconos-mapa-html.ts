/** SVG inline (estilo Lucide) para popups y marcadores Leaflet. */

export type TipoIconoMapaHtml = "ubicacion" | "casa" | "huella";

const TRAZOS: Record<TipoIconoMapaHtml, string> = {
  ubicacion:
    '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  casa: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  huella:
    '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
};

export function svgIconoMapa(
  tipo: TipoIconoMapaHtml,
  size = 16,
  clase = "pp-svg-mapa"
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${clase}" aria-hidden="true">${TRAZOS[tipo]}</svg>`;
}

/** Título de popup con icono SVG al inicio. */
export function tituloPopupMapa(
  tipo: TipoIconoMapaHtml,
  texto: string
): string {
  return `<span class="pp-popup-titulo-inner">${svgIconoMapa(tipo, 15, "pp-svg-mapa pp-svg-mapa--popup")}<span>${texto}</span></span>`;
}
