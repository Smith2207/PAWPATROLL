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

export const MODELO_CLIP = "openai/clip-vit-base-patch32";
const MODELO_XENOVA =
  process.env.CLIP_MODEL?.trim() || "Xenova/clip-vit-base-patch32";
const DIM = 512;
const CACHE = join(cwd(), ".cache", "transformers");

env.allowLocalModels = true;
env.allowRemoteModels = true;
env.useBrowserCache = false;
env.useFSCache = true;
env.cacheDir = CACHE;

let extractorPromise = null;

function parseDataUrl(dataUrl) {
  const m = /^data:image\/([\w+.-]+);base64,(.+)$/i.exec(dataUrl);
  if (!m) throw new Error("Data URL inválido");
  const sub = m[1].toLowerCase();
  const ext =
    sub === "jpeg" || sub === "jpg" ? "jpg" : sub === "png" ? "png" : "img";
  return { buffer: Buffer.from(m[2], "base64"), ext };
}

async function dataUrlARawImage(dataUrl) {
  const { buffer, ext } = parseDataUrl(dataUrl);
  const dir = join(tmpdir(), "pawpatroll-clip");
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${randomUUID()}.${ext}`);
  await writeFile(path, buffer);
  try {
    return await RawImage.read(path);
  } finally {
    await unlink(path).catch(() => {});
  }
}

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline("image-feature-extraction", MODELO_XENOVA);
  }
  return extractorPromise;
}

export async function embeddingDesdeDataUrl(dataUrl) {
  const preparada = await preprocesarDataUrlParaClip(dataUrl);
  const extractor = await getExtractor();
  const image = await dataUrlARawImage(preparada);
  const out = await extractor(image, { normalize: true });
  const vec = Array.from(out.data);
  if (vec.length < DIM) {
    throw new Error(`Dimensión ${vec.length}, esperadas ${DIM}`);
  }
  return { vector: vec.slice(0, DIM), modelo: MODELO_CLIP };
}

export { CACHE as carpetaCacheModelo };
