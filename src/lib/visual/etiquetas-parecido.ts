/**
 * Búsqueda visual por foto (embeddings Gemini/CLIP): etiquetas-parecido.
 */
export type NivelParecido = "mucho" | "algo" | "poco";

export function nivelParecido(similitud: number): NivelParecido {
  if (similitud >= 75) return "mucho";
  if (similitud >= 50) return "algo";
  return "poco";
}

export function textoNivelParecido(nivel: NivelParecido): string {
  if (nivel === "mucho") return "Mucho parecido";
  if (nivel === "algo") return "Algo parecido";
  return "Poco parecido";
}

export function textoParecido(similitud: number): string {
  return textoNivelParecido(nivelParecido(similitud));
}
