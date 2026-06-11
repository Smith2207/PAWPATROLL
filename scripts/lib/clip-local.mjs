/**
 * Script auxiliar (CLI): clip-local.
 */
import { mkdir, unlink, writeFile } from "fs/promises";
import { join } from "path";
import { cwd } from "process";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { env, pipeline, RawImage } from "@xenova/transformers";
import { preprocesarDataUrlParaClip } from "./preprocesar-imagen.mjs";
import { dataUrlABuffer } from "./data-url.mjs";
import {
  DIMENSION_CLIP,
  MODELO_CLIP,
  MODELO_XENOVA_LOCAL,
} from "./clip-config.mjs";

const CACHE = join(cwd(), ".cache", "transformers");

env.allowLocalModels = true;
env.allowRemoteModels = true;
env.useBrowserCache = false;
env.useFSCache = true;
env.cacheDir = CACHE;

let extractorPromise = null;

async function dataUrlARawImage(dataUrl) {
  const { buffer, extension } = dataUrlABuffer(dataUrl);
  const dir = join(tmpdir(), "pawpatroll-clip");
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${randomUUID()}.${extension}`);
  await writeFile(path, buffer);
  try {
    return await RawImage.read(path);
  } finally {
    await unlink(path).catch(() => {});
  }
}

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline("image-feature-extraction", MODELO_XENOVA_LOCAL);
  }
  return extractorPromise;
}

export async function embeddingDesdeDataUrl(dataUrl) {
  const preparada = await preprocesarDataUrlParaClip(dataUrl);
  const extractor = await getExtractor();
  const image = await dataUrlARawImage(preparada);
  const out = await extractor(image, { normalize: true });
  const vec = Array.from(out.data);
  if (vec.length < DIMENSION_CLIP) {
    throw new Error(`Dimensión ${vec.length}, esperadas ${DIMENSION_CLIP}`);
  }
  return { vector: vec.slice(0, DIMENSION_CLIP), modelo: MODELO_CLIP };
}

export { CACHE as carpetaCacheModelo, MODELO_CLIP } from "./clip-config.mjs";
