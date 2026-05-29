/**
 * Gemini Enterprise Agent Platform: Flash (visión) + Embedding 2 (768d).
 * Auth: JSON cuenta de servicio o ADC. API key Express solo sin project+JSON.
 */

import { existsSync, readFileSync } from "fs";
import type { GoogleGenAI } from "@google/genai";

export const MODELO_GEMINI_VISION =
  process.env.GEMINI_VISION_MODEL?.trim() || "gemini-2.5-flash";

export const MODELO_GEMINI_EMBEDDING =
  process.env.GEMINI_EMBEDDING_MODEL?.trim() ||
  "gemini-embedding-2-preview";

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

function apiKeyGemini(): string | undefined {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    undefined
  );
}

function ubicacion(): string {
  return process.env.GOOGLE_CLOUD_LOCATION?.trim() || "us-central1";
}

function usaAgentPlatform(): boolean {
  const v = process.env.GOOGLE_GENAI_USE_ENTERPRISE?.trim().toLowerCase();
  if (v === "false" || v === "0") return false;
  return true;
}

function modoPlataforma() {
  return usaAgentPlatform()
    ? ({ enterprise: true as const } as const)
    : ({ vertexai: true as const } as const);
}

function parseCredentials(): object | undefined {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
  if (raw) {
    try {
      return JSON.parse(raw) as object;
    } catch {
      throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON no es JSON válido.");
    }
  }

  const ruta = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (ruta && existsSync(ruta)) {
    try {
      return JSON.parse(readFileSync(ruta, "utf8")) as object;
    } catch {
      throw new Error(
        `No se pudo leer JSON en GOOGLE_APPLICATION_CREDENTIALS: ${ruta}`
      );
    }
  }

  return undefined;
}

function opcionesClienteGoogleGenAI() {
  const project = proyectoGoogleCloud();
  const location = ubicacion();
  const credentials = parseCredentials();
  const plataforma = modoPlataforma();

  if (credentials && project) {
    return {
      ...plataforma,
      project,
      location,
      googleAuthOptions: { credentials },
    };
  }

  if (project) {
    return { ...plataforma, project, location };
  }

  const apiKey = apiKeyGemini();
  if (apiKey) {
    return { ...plataforma, apiKey };
  }

  throw new Error(
    "Falta GOOGLE_CLOUD_PROJECT + cuenta de servicio. Vercel: GOOGLE_APPLICATION_CREDENTIALS_JSON."
  );
}

let clientePromise: Promise<GoogleGenAI> | null = null;

export async function getAIClient(): Promise<GoogleGenAI> {
  if (!clientePromise) {
    clientePromise = (async () => {
      const { GoogleGenAI } = await import("@google/genai");
      return new GoogleGenAI(opcionesClienteGoogleGenAI());
    })();
  }
  return clientePromise;
}

export function geminiConfigurada(): boolean {
  return Boolean(
    proyectoGoogleCloud() || parseCredentials() || apiKeyGemini()
  );
}

function dimensionSalida(): number {
  const n = Number(
    process.env.GEMINI_EMBEDDING_DIMENSION ?? String(DIMENSION_EMBEDDING)
  );
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

/** Paso 2: texto → vector 768d. */
export async function embeddingDesdeTexto(texto: string): Promise<number[]> {
  const ai = await getAIClient();
  const response = await ai.models.embedContent({
    model: MODELO_GEMINI_EMBEDDING,
    contents: texto,
    config: { outputDimensionality: dimensionSalida() },
  });

  const values = response.embeddings?.[0]?.values;
  if (!values?.length) {
    throw new Error(`${MODELO_GEMINI_EMBEDDING} no devolvió vector.`);
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
