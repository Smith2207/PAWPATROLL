/**
 * Punto único para embeddings visuales: Gemini (preferido) o CLIP local (respaldo).
 */

import { geminiEmbeddingConfigurada } from "@/lib/visual/gemini-embedding";

export type ProveedorEmbedding = "gemini" | "clip";

export function proveedorVisualActivo(): ProveedorEmbedding {
  const modo = process.env.VISUAL_PROVIDER?.trim().toLowerCase();
  if (modo === "clip") return "clip";
  if (modo === "gemini") return "gemini";
  return geminiEmbeddingConfigurada() ? "gemini" : "clip";
}

async function moduloActivo() {
  if (proveedorVisualActivo() === "gemini") {
    return import("@/lib/visual/gemini-embedding");
  }
  return import("@/lib/visual/clip-embedding");
}

export function embeddingApiConfigurada(): boolean {
  if (proveedorVisualActivo() === "gemini") {
    return geminiEmbeddingConfigurada();
  }
  return true;
}

export async function modeloEmbeddingActivo(): Promise<string> {
  const mod = await moduloActivo();
  if ("MODELO_GEMINI_EMBEDDING" in mod) {
    return mod.MODELO_GEMINI_EMBEDDING;
  }
  return mod.MODELO_CLIP;
}

export async function embeddingDesdeDataUrl(
  dataUrl: string,
  opciones?: { sinPreproceso?: boolean }
): Promise<{ vector: number[]; modelo: string; descripcion?: string }> {
  const mod = await moduloActivo();
  return mod.embeddingDesdeDataUrl(dataUrl, opciones);
}

export async function coseno(a: number[], b: number[]): Promise<number> {
  const mod = await moduloActivo();
  return mod.coseno(a, b);
}
