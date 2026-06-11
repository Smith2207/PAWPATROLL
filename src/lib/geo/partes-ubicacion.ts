/** Partes únicas de una etiqueta (barrio, ciudad, etc.). */
export function partesUbicacionUnicas(
  ...candidatos: (string | null | undefined)[]
): string[] {
  return candidatos
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p))
    .filter((p, i, arr) => arr.indexOf(p) === i);
}

export function subtituloDesdePartes(
  ...candidatos: (string | null | undefined)[]
): string | undefined {
  const partes = partesUbicacionUnicas(...candidatos);
  return partes.length > 0 ? partes.join(", ") : undefined;
}
