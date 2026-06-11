import L from "leaflet";
import { svgIconoMapa, type TipoIconoMapaHtml } from "@/lib/geo/iconos-mapa-html";

/** Diámetro del círculo con foto en todos los marcadores del mapa */
export const TAMANO_MARCADOR_FOTO = 44;

/** Corrige iconos por defecto de Leaflet en bundlers (Next.js). */
export function configurarIconosLeaflet(): void {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
    ._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

export function iconoHtml(contenido: string, clase = ""): L.DivIcon {
  const tam = TAMANO_MARCADOR_FOTO;
  const mitad = tam / 2;
  return L.divIcon({
    className: `pp-marcador ${clase}`.trim(),
    html: `<div class="pp-marcador-pin">${contenido}</div>`,
    iconSize: [tam, tam],
    iconAnchor: [mitad, tam],
    popupAnchor: [0, -tam + 6],
  });
}

export function iconoSvgMapa(tipo: TipoIconoMapaHtml, clase = ""): L.DivIcon {
  return iconoHtml(svgIconoMapa(tipo, 22, "pp-svg-mapa pp-svg-mapa--pin"), clase);
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escaparSrc(url: string): string {
  return escaparHtml(url);
}

function urlFotoValida(url: string | null | undefined): url is string {
  if (!url) return false;
  return url.startsWith("data:image/") || url.startsWith("http");
}

export type OpcionesIconoFoto = {
  clase?: string;
  /** Texto o SVG cuando no hay foto */
  fallbackContenido?: string;
  /** Un solo número en el pin */
  badge?: string | number;
  /** Varios números (ej. avistamientos #3 y #4 en el mismo punto) */
  badges?: (string | number)[];
  tamano?: number;
  /** Borde del pin y badges (mismo color que el cerco de la mascota) */
  colorFamilia?: string;
};

function numerosPin(opciones: OpcionesIconoFoto): (string | number)[] {
  if (opciones.badges?.length) return opciones.badges;
  if (opciones.badge != null) return [opciones.badge];
  return [];
}

function estiloFamiliaAttr(colorFamilia?: string): string {
  if (!colorFamilia) return "";
  return ` style="--pp-familia-color:${escaparHtml(colorFamilia)}"`;
}

function htmlBadgesPin(numeros: (string | number)[]): string {
  if (numeros.length === 0) return "";
  if (numeros.length === 1) {
    return `<span class="pp-marcador-badge">${numeros[0]}</span>`;
  }
  return `<div class="pp-marcador-badges">${numeros
    .map((n) => `<span class="pp-marcador-badge">${n}</span>`)
    .join("")}</div>`;
}

/** Marcador circular con la primera foto de la mascota (o emoji si no hay). */
export function iconoFoto(
  fotoUrl: string | null | undefined,
  opciones: OpcionesIconoFoto = {}
): L.DivIcon {
  const tam = opciones.tamano ?? TAMANO_MARCADOR_FOTO;
  const mitad = tam / 2;
  const clase = opciones.clase ?? "";
  const familia = opciones.colorFamilia ? " pp-marcador--familia" : "";
  const estiloFamilia = estiloFamiliaAttr(opciones.colorFamilia);
  const fallback =
    opciones.fallbackContenido ??
    svgIconoMapa("huella", 20, "pp-svg-mapa pp-svg-mapa--pin");
  const badgesHtml = htmlBadgesPin(numerosPin(opciones));

  if (urlFotoValida(fotoUrl)) {
    return L.divIcon({
      className: `pp-marcador pp-marcador--foto ${clase}${familia}`.trim(),
      html: `<div class="pp-marcador-pin pp-marcador-pin--foto"${estiloFamilia}><span class="pp-marcador-foto-crop"><img src="${escaparSrc(fotoUrl)}" alt="" decoding="async" loading="lazy" width="${tam}" height="${tam}" /></span>${badgesHtml}</div>`,
      iconSize: [tam, tam],
      iconAnchor: [mitad, tam],
      popupAnchor: [0, -tam + 6],
    });
  }

  if (badgesHtml) {
    return L.divIcon({
      className: `pp-marcador ${clase}${familia}`.trim(),
      html: `<div class="pp-marcador-pin pp-marcador-pin--fallback"${estiloFamilia}>${fallback}${badgesHtml}</div>`,
      iconSize: [tam, tam],
      iconAnchor: [mitad, tam],
      popupAnchor: [0, -tam + 6],
    });
  }

  return iconoHtml(fallback, clase);
}

/** Pin principal: punto donde se perdió la mascota (foto grande + etiqueta). */
export function iconoPuntoPerdida(
  fotoUrl: string | null | undefined,
  nombre: string,
  fallbackContenido = svgIconoMapa("huella", 20, "pp-svg-mapa pp-svg-mapa--pin")
): L.DivIcon {
  const tam = TAMANO_MARCADOR_FOTO;
  const ancho = 88;
  const altoPin = tam + 40;
  const img = urlFotoValida(fotoUrl)
    ? `<img src="${escaparSrc(fotoUrl)}" alt="" decoding="async" loading="lazy" />`
    : `<span class="pp-marcador-perdida-fallback">${fallbackContenido}</span>`;

  return L.divIcon({
    className: "pp-marcador pp-marcador--foto pp-marcador--punto-perdida",
    html: `
      <div class="pp-marcador-perdida-wrap">
        <div class="pp-marcador-pin pp-marcador-pin--foto pp-marcador-pin--perdida-central">${img}</div>
        <span class="pp-marcador-perdida-etiq">Se perdió aquí</span>
        <span class="pp-marcador-perdida-nombre">${escaparHtml(nombre)}</span>
      </div>
    `,
    iconSize: [ancho, altoPin],
    iconAnchor: [ancho / 2, tam + 8],
    popupAnchor: [0, -tam],
  });
}

/** Punto azul estilo Google Maps */
export function iconoUbicacionUsuario(): L.DivIcon {
  return L.divIcon({
    className: "pp-marcador-usuario-wrap",
    html: `<div class="pp-marcador-usuario"><div class="pp-marcador-usuario-punto"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}
