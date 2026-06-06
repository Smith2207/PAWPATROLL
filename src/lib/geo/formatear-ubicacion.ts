const PALABRAS_MINUSCULAS = new Set([
  "de",
  "del",
  "la",
  "las",
  "el",
  "los",
  "y",
  "e",
]);

/** "SAN ROMAN" → "San Román" (aprox.; la fuente viene en mayúsculas sin tildes). */
export function formatearNombreUbicacion(raw: string) {
  return raw
    .trim()
    .split(/\s+/)
    .map((palabra, indice) => {
      const lower = palabra.toLowerCase();
      if (indice > 0 && PALABRAS_MINUSCULAS.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function etiquetaUbicacionPeru(
  departamento: string,
  provincia: string,
  distrito: string
) {
  return `${formatearNombreUbicacion(departamento)} / ${formatearNombreUbicacion(provincia)} / ${formatearNombreUbicacion(distrito)}`;
}

export function normalizarTextoBusqueda(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
