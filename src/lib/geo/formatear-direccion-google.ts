/**
 * Geolocalización y mapas: formatear-direccion-google.
 */
import { normalizarTextoBusqueda } from "@/lib/geo/formatear-ubicacion";
import { subtituloDesdePartes } from "@/lib/geo/partes-ubicacion";

/** Código Plus al inicio (ej. 5X5C+QR3). Google Maps no lo muestra en la etiqueta principal. */
const REGEX_CODIGO_PLUS = /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}\s*/i;

export type ComponenteDireccionGoogle = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type ResultadoGeocodeGoogle = {
  formatted_address?: string;
  address_components?: ComponenteDireccionGoogle[];
  types?: string[];
};

function componente(
  componentes: ComponenteDireccionGoogle[],
  ...tipos: string[]
): string | null {
  const c = componentes.find((x) => tipos.some((t) => x.types.includes(t)));
  return c?.long_name?.trim() || null;
}

function quitarCodigoPlus(texto: string): string {
  return texto.replace(REGEX_CODIGO_PLUS, "").trim();
}

function limpiarColaPeru(texto: string): string {
  return texto
    .replace(/,?\s*\d{5}\s*,?\s*Per[uú]$/i, "")
    .replace(/,?\s*Per[uú]$/i, "")
    .trim();
}

/** Etiqueta corta legible, al estilo de Google Maps. */
export function etiquetaLegibleGeocodeGoogle(
  resultado: ResultadoGeocodeGoogle
): string | null {
  const componentes = resultado.address_components ?? [];

  const lugar =
    componente(
      componentes,
      "establishment",
      "point_of_interest",
      "tourist_attraction",
      "park",
      "square",
      "premise",
      "route",
      "intersection"
    ) ?? null;

  const distrito =
    componente(
      componentes,
      "sublocality",
      "sublocality_level_1",
      "neighborhood",
      "administrative_area_level_3"
    ) ?? null;

  const ciudad =
    componente(
      componentes,
      "locality",
      "administrative_area_level_2"
    ) ?? null;

  if (lugar) {
    const lugarLower = lugar.toLowerCase();
    if (ciudad && !lugarLower.includes(ciudad.toLowerCase())) {
      return `${lugar}, ${ciudad}`;
    }
    if (distrito && !lugarLower.includes(distrito.toLowerCase()) && distrito !== ciudad) {
      return `${lugar}, ${distrito}`;
    }
    return lugar;
  }

  const partes = [distrito, ciudad].filter(
    (p, i, arr) => p && arr.indexOf(p) === i
  ) as string[];
  if (partes.length > 0) {
    return partes.join(", ");
  }

  const cruda = resultado.formatted_address?.trim();
  if (!cruda) return null;

  return limpiarColaPeru(quitarCodigoPlus(cruda));
}

export function formatearDireccionGoogle(texto: string): string {
  const limpio = limpiarColaPeru(quitarCodigoPlus(texto.trim()));
  return limpio || texto.trim();
}

/** Línea secundaria (barrio, ciudad) cuando ya tenemos el nombre del lugar. */
export function subtituloDesdeNombreYDireccion(
  nombre: string | null | undefined,
  direccion: string
): string | undefined {
  const dir = formatearDireccionGoogle(direccion);
  if (!dir) return undefined;
  if (!nombre?.trim()) return dir;

  const nombreNorm = normalizarTextoBusqueda(nombre.trim());
  const partes = dir
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => normalizarTextoBusqueda(p) !== nombreNorm);

  if (partes.length > 0) return partes.join(", ");
  return undefined;
}

export function limpiarSubtituloAutocomplete(texto: string): string | undefined {
  const limpio = texto.replace(/,?\s*Per[uú]$/i, "").trim();
  return limpio || undefined;
}

export function etiquetaYNombreDesdeGoogle(
  nombre: string | null | undefined,
  direccion: string | null | undefined,
  pista?: { etiqueta?: string; subtitulo?: string },
  fallback = "Lugar seleccionado"
): { etiqueta: string; subtitulo?: string } {
  const etiqueta =
    nombre?.trim() ||
    pista?.etiqueta?.trim() ||
    (direccion ? formatearDireccionGoogle(direccion) : null) ||
    fallback;
  const subtitulo =
    pista?.subtitulo?.trim() ||
    (nombre && direccion
      ? subtituloDesdeNombreYDireccion(nombre, direccion)
      : undefined);

  return { etiqueta, subtitulo };
}

/** Si Geocoding solo devolvió Plus Code, usar lo que escribió el usuario como nombre. */
export function etiquetaGeocodeConConsulta(
  consulta: string,
  resultado: ResultadoGeocodeGoogle & { types?: string[] }
): { etiqueta: string; subtitulo?: string } | null {
  const cruda = resultado.formatted_address?.trim();
  if (!cruda || !REGEX_CODIGO_PLUS.test(cruda)) return null;

  const esPoi = resultado.types?.some((t) =>
    ["establishment", "point_of_interest", "tourist_attraction", "park"].includes(t)
  );
  if (!esPoi) return null;

  const componentes = resultado.address_components ?? [];
  return {
    etiqueta: consulta.trim(),
    subtitulo: subtituloDesdePartes(
      componente(componentes, "sublocality", "sublocality_level_1", "neighborhood", "route"),
      componente(componentes, "locality", "administrative_area_level_2")
    ),
  };
}

/** Descarta resultados Geocoding que no reflejan lo que buscó el usuario. */
export function resultadoGooglePareceUtil(
  consulta: string,
  lugar: { etiqueta: string; subtitulo?: string; placeId?: string; lat?: number }
): boolean {
  if (lugar.placeId && lugar.lat == null) return true;

  const palabras = normalizarTextoBusqueda(consulta)
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (palabras.length === 0) return true;

  const texto = normalizarTextoBusqueda(
    `${lugar.etiqueta} ${lugar.subtitulo ?? ""}`
  );

  return palabras.some((p) => texto.includes(p));
}
