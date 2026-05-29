/**
 * CLIP 512-d local (@xenova/transformers).
 * Pesos: openai/clip-vit-base-patch32 → ONNX Xenova/clip-vit-base-patch32
 * Cache en disco: .cache/transformers/ (ver config.ts)
 */

import { mkdir, unlink, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { env, pipeline, RawImage } from "@xenova/transformers";
import {
  CARPETA_CACHE_MODELO,
  MODELO_XENOVA_LOCAL,
} from "@/lib/visual/config";
import { dataUrlABuffer } from "@/lib/visual/data-url";
import { preprocesarDataUrlParaClip } from "@/lib/visual/preprocesar-imagen";

/** Nombre canónico guardado en BD */
export const MODELO_CLIP = "openai/clip-vit-base-patch32";

const DIM_ESPERADA = 512;

env.allowLocalModels = true;
env.allowRemoteModels = true;
env.useBrowserCache = false;
env.useFSCache = true;
env.cacheDir = CARPETA_CACHE_MODELO;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractorPromise: Promise<any> | null = null;

async function obtenerExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline(
      "image-feature-extraction",
      MODELO_XENOVA_LOCAL
    );
  }
  return extractorPromise;
}

async function dataUrlARawImage(dataUrl: string): Promise<RawImage> {
  const { buffer, extension } = dataUrlABuffer(dataUrl);
  const dir = join(tmpdir(), "pawpatroll-clip");
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${crypto.randomUUID()}.${extension}`);
  await writeFile(path, buffer);
  try {
    return await RawImage.read(path);
  } finally {
    await unlink(path).catch(() => {});
  }
}

function tensorAVector(output: {
  data: Float32Array | number[];
}): number[] {
  const vec = Array.from(output.data as ArrayLike<number>);
  if (vec.length === DIM_ESPERADA) return vec;
  if (vec.length > DIM_ESPERADA) return vec.slice(0, DIM_ESPERADA);
  throw new Error(
    `Embedding con dimensión ${vec.length}; se esperaban ${DIM_ESPERADA}.`
  );
}

export function clipApiConfigurada(): boolean {
  return true;
}

export function rutaCacheModelo(): string {
  return CARPETA_CACHE_MODELO;
}

export async function embeddingDesdeDataUrl(
  dataUrl: string,
  opciones?: { sinPreproceso?: boolean }
): Promise<{ vector: number[]; modelo: string }> {
  if (!dataUrl.startsWith("data:image/")) {
    throw new Error("La imagen debe ser un data URL (data:image/...).");
  }

  const preparada = opciones?.sinPreproceso
    ? dataUrl
    : await preprocesarDataUrlParaClip(dataUrl);

  const extractor = await obtenerExtractor();
  const imagen = await dataUrlARawImage(preparada);
  const salida = await extractor(imagen, { normalize: true });
  const vector = tensorAVector(salida);

  return { vector, modelo: MODELO_CLIP };
}

export async function embeddingDesdeBuffer(
  buffer: Buffer,
  mime = "image/jpeg"
): Promise<{ vector: number[]; modelo: string }> {
  const b64 = buffer.toString("base64");
  return embeddingDesdeDataUrl(`data:${mime};base64,${b64}`);
}

export function coseno(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i]! * b[i]!;
  return dot;
}
