/**
 * CLIP 512-d local (@xenova/transformers).
 * En Vercel: WASM (onnxruntime-web), sin libonnxruntime.so nativo.
 */

import { MODELO_XENOVA_LOCAL } from "@/lib/visual/config";
import {
  configurarEnvTransformers,
  esEntornoServerless,
  parcheReleaseParaOnnxWeb,
} from "@/lib/visual/entorno-clip";
import { dataUrlABuffer } from "@/lib/visual/data-url";
import { preprocesarDataUrlParaClip } from "@/lib/visual/preprocesar-imagen";

/** Nombre canónico guardado en BD */
export const MODELO_CLIP = "openai/clip-vit-base-patch32";

const DIM_ESPERADA = 512;

type ModuloTransformers = typeof import("@xenova/transformers");
type ImagenClip = Awaited<ReturnType<ModuloTransformers["RawImage"]["read"]>>;

let transformersPromise: Promise<ModuloTransformers> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractorPromise: Promise<any> | null = null;

async function cargarTransformers(): Promise<ModuloTransformers> {
  if (!transformersPromise) {
    transformersPromise = (async () => {
      const restaurar = esEntornoServerless()
        ? parcheReleaseParaOnnxWeb()
        : () => {};
      try {
        const mod = await import("@xenova/transformers");
        configurarEnvTransformers(mod);
        return mod;
      } finally {
        restaurar();
      }
    })();
  }
  return transformersPromise;
}

async function obtenerExtractor() {
  if (!extractorPromise) {
    extractorPromise = cargarTransformers().then(({ pipeline }) =>
      pipeline("image-feature-extraction", MODELO_XENOVA_LOCAL)
    );
  }
  return extractorPromise;
}

async function dataUrlARawImage(dataUrl: string): Promise<ImagenClip> {
  const { RawImage } = await cargarTransformers();
  const { buffer } = dataUrlABuffer(dataUrl);
  const sharp = (await import("sharp")).default;
  const { data, info } = await sharp(buffer)
    .rotate()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return new RawImage(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    info.channels
  );
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

export function clipUsaWasmEnServidor(): boolean {
  return esEntornoServerless();
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
