/**
 * Gemini Enterprise Agent Platform para scripts CLI.
 * Auth: JSON cuenta de servicio (archivo o env) o ADC.
 */
import { readFileSync, existsSync } from "fs";
import { GoogleGenAI } from "@google/genai";

export const MODELO_GEMINI_VISION =
  process.env.GEMINI_VISION_MODEL?.trim() || "gemini-2.5-flash";

export const MODELO_GEMINI_EMBEDDING =
  process.env.GEMINI_EMBEDDING_MODEL?.trim() ||
  "gemini-embedding-2-preview";

const PROMPT = `Describe esta mascota (perro o gato) para búsqueda visual.
Incluye: especie, tamaño, colores del pelaje, patrones, señas visibles.
Responde en español, solo palabras clave separadas por comas.`;

function proyecto() {
  return (
    process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
    process.env.GCP_PROJECT_ID?.trim()
  );
}

function usaAgentPlatform() {
  const v = process.env.GOOGLE_GENAI_USE_ENTERPRISE?.trim().toLowerCase();
  if (v === "false" || v === "0") return false;
  return true;
}

function modoPlataforma() {
  return usaAgentPlatform() ? { enterprise: true } : { vertexai: true };
}

function parseCredentials() {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON no es JSON válido.");
    }
  }

  const ruta = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (ruta && existsSync(ruta)) {
    try {
      return JSON.parse(readFileSync(ruta, "utf8"));
    } catch {
      throw new Error(
        `No se pudo leer JSON en GOOGLE_APPLICATION_CREDENTIALS: ${ruta}`
      );
    }
  }

  return undefined;
}

function opcionesCliente() {
  const project = proyecto();
  const location = process.env.GOOGLE_CLOUD_LOCATION?.trim() || "us-central1";
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

  throw new Error("Falta GOOGLE_CLOUD_PROJECT y cuenta de servicio.");
}

function getAIClient() {
  return new GoogleGenAI(opcionesCliente());
}

let clientePromise = null;

async function cliente() {
  if (!clientePromise) clientePromise = Promise.resolve(getAIClient());
  return clientePromise;
}

export function geminiEmbeddingConfigurada() {
  return Boolean(proyecto() && parseCredentials());
}

export async function verificarCredencialesGemini() {
  if (!geminiEmbeddingConfigurada()) {
    throw new Error(
      "Falta GOOGLE_CLOUD_PROJECT y GOOGLE_APPLICATION_CREDENTIALS apuntando al JSON descargado (no pegues el JSON multilínea en .env)."
    );
  }

  const ai = await cliente();
  await ai.models.embedContent({
    model: MODELO_GEMINI_EMBEDDING,
    contents: "verificacion",
    config: {
      outputDimensionality: Number(
        process.env.GEMINI_EMBEDDING_DIMENSION ?? "768"
      ),
    },
  });
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
  const { buffer, mime } = dataUrlABuffer(dataUrl);
  const descripcion = await describir(buffer, mime);
  const vector = await embed(descripcion);
  return { vector, descripcion, modelo: MODELO_GEMINI_EMBEDDING };
}
