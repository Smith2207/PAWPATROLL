/**
 * Gemini Flash + Embedding 2 para scripts CLI.
 */
import { GoogleGenAI } from "@google/genai";

export const MODELO_GEMINI_VISION =
  process.env.GEMINI_VISION_MODEL?.trim() || "gemini-1.5-flash";

export const MODELO_GEMINI_EMBEDDING =
  process.env.GEMINI_EMBEDDING_MODEL?.trim() || "gemini-embedding-2";

const PROMPT = `Describe esta mascota (perro o gato) para búsqueda visual.
Incluye: especie, tamaño, colores del pelaje, patrones, señas visibles.
Responde en español, solo palabras clave separadas por comas.`;

function proyecto() {
  return (
    process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
    process.env.GCP_PROJECT_ID?.trim()
  );
}

function getAIClient() {
  const project = proyecto();
  if (!project) throw new Error("Falta GOOGLE_CLOUD_PROJECT.");
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
  const credentials = raw ? JSON.parse(raw) : undefined;
  return new GoogleGenAI({
    vertexai: true,
    project,
    location: process.env.GOOGLE_CLOUD_LOCATION?.trim() || "us-central1",
    googleAuthOptions: credentials ? { credentials } : undefined,
  });
}

let clientePromise = null;

async function cliente() {
  if (!clientePromise) clientePromise = Promise.resolve(getAIClient());
  return clientePromise;
}

export function geminiEmbeddingConfigurada() {
  return Boolean(proyecto());
}

function dataUrlABuffer(dataUrl) {
  const match = /^data:image\/([\w+.-]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new Error("Data URL inválido.");
  const buffer = Buffer.from(match[2], "base64");
  const sub = match[1].toLowerCase();
  const mime = sub === "jpg" ? "image/jpeg" : `image/${sub}`;
  return { buffer, mime };
}

async function describir(buffer, mime) {
  const ai = await cliente();
  const mimeType = mime === "image/jpg" ? "image/jpeg" : mime;
  const res = await ai.models.generateContent({
    model: MODELO_GEMINI_VISION,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: buffer.toString("base64") } },
          { text: PROMPT },
        ],
      },
    ],
  });
  const texto = res.text?.trim();
  if (!texto) throw new Error("Sin descripción de Flash.");
  return texto;
}

async function embed(texto) {
  const ai = await cliente();
  const dim = Number(process.env.GEMINI_EMBEDDING_DIMENSION ?? "768");
  const res = await ai.models.embedContent({
    model: MODELO_GEMINI_EMBEDDING,
    contents: texto,
    config: { outputDimensionality: dim },
  });
  const values = res.embeddings?.[0]?.values;
  if (!values?.length) throw new Error("Sin embedding.");
  return [...values];
}

export async function embeddingDesdeDataUrl(dataUrl) {
  if (!geminiEmbeddingConfigurada()) {
    throw new Error("Falta GOOGLE_CLOUD_PROJECT.");
  }
  const { buffer, mime } = dataUrlABuffer(dataUrl);
  const descripcion = await describir(buffer, mime);
  const vector = await embed(descripcion);
  return { vector, descripcion, modelo: MODELO_GEMINI_EMBEDDING };
}
