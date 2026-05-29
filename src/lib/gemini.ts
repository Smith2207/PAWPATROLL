/**
 * Gemini en Vertex: Flash (visión) + Embedding 2 (768d).
 * Vercel: GOOGLE_APPLICATION_CREDENTIALS_JSON. Local: ADC (gcloud auth application-default login).
 */

import type { GoogleGenAI } from "@google/genai";

export const MODELO_GEMINI_VISION =
  process.env.GEMINI_VISION_MODEL?.trim() || "gemini-1.5-flash";

export const MODELO_GEMINI_EMBEDDING =
  process.env.GEMINI_EMBEDDING_MODEL?.trim() || "gemini-embedding-2";

export const DIMENSION_EMBEDDING = 768;

const PROMPT_DESCRIPCION = `Describe esta mascota (perro o gato) para búsqueda visual.
Incluye: especie, tamaño aproximado, colores del pelaje, patrones (atigrado, manchas), orejas, cola, señas visibles.
Responde en español, solo palabras clave separadas por comas, sin frases largas ni opiniones.`;

export function proyectoGoogleCloud(): string | undefined {
  return (
    process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
    process.env.GCP_PROJECT_ID?.trim() ||
    process.env.GCLOUD_PROJECT?.trim() ||
    undefined
  );
}

function ubicacion(): string {
  return process.env.GOOGLE_CLOUD_LOCATION?.trim() || "us-central1";
}

function parseCredentials(): object | undefined {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as object;
  } catch {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON no es JSON válido.");
  }
}

let clientePromise: Promise<GoogleGenAI> | null = null;

export async function getAIClient(): Promise<GoogleGenAI> {
  if (!clientePromise) {
    clientePromise = (async () => {
      const project = proyectoGoogleCloud();
      if (!project) {
        throw new Error(
          "Falta GOOGLE_CLOUD_PROJECT. Vercel: cuenta de servicio en GOOGLE_APPLICATION_CREDENTIALS_JSON."
        );
      }
      const { GoogleGenAI } = await import("@google/genai");
      const credentials = parseCredentials();
      return new GoogleGenAI({
        vertexai: true,
        project,
        location: ubicacion(),
        googleAuthOptions: credentials ? { credentials } : undefined,
      });
    })();
  }
  return clientePromise;
}

export function geminiConfigurada(): boolean {
  return Boolean(proyectoGoogleCloud());
}

function dimensionSalida(): number {
  const n = Number(process.env.GEMINI_EMBEDDING_DIMENSION ?? String(DIMENSION_EMBEDDING));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : DIMENSION_EMBEDDING;
}

/** Paso 1: imagen → descripción técnica (keywords). */
export async function describirImagenDesdeBuffer(
  buffer: Buffer,
  mime: string
): Promise<string> {
  const ai = await getAIClient();
  const mimeType = mime === "image/jpg" ? "image/jpeg" : mime;
  const data = buffer.toString("base64");

  const response = await ai.models.generateContent({
    model: MODELO_GEMINI_VISION,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data } },
          { text: PROMPT_DESCRIPCION },
        ],
      },
    ],
  });

  const texto = response.text?.trim();
  if (!texto) {
    throw new Error("Gemini Flash no devolvió descripción de la imagen.");
  }
  return texto;
}

/** Paso 2: texto → vector 768d (gemini-embedding-2). */
export async function embeddingDesdeTexto(texto: string): Promise<number[]> {
  const ai = await getAIClient();
  const response = await ai.models.embedContent({
    model: MODELO_GEMINI_EMBEDDING,
    contents: texto,
    config: { outputDimensionality: dimensionSalida() },
  });

  const values = response.embeddings?.[0]?.values;
  if (!values?.length) {
    throw new Error("gemini-embedding-2 no devolvió vector.");
  }
  return [...values];
}

export type ResultadoVectorImagen = {
  vector: number[];
  descripcion: string;
  modelo: string;
};

/** Imagen → descripción Flash → embedding 768d. */
export async function vectorDesdeImagenBuffer(
  buffer: Buffer,
  mime: string
): Promise<ResultadoVectorImagen> {
  const descripcion = await describirImagenDesdeBuffer(buffer, mime);
  const vector = await embeddingDesdeTexto(descripcion);
  return {
    vector,
    descripcion,
    modelo: MODELO_GEMINI_EMBEDDING,
  };
}

export function coseno(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const den = Math.sqrt(na) * Math.sqrt(nb);
  return den > 0 ? dot / den : 0;
}
