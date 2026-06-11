/**
 * Búsqueda visual por foto (embeddings Gemini/CLIP): entorno-clip.
 */
import { join } from "path";
import { tmpdir } from "os";

/** Vercel/Lambda: sin binarios nativos de onnxruntime-node */
export function esEntornoServerless(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.VERCEL_ENV ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.CLIP_USAR_WASM === "1"
  );
}

/**
 * Transformers.js elige onnxruntime-node si process.release.name === 'node'.
 * PawPatrol sustituye onnxruntime-node por onnxruntime-web (WASM): forzamos esa rama
 * sin mutar process.release.name (solo lectura en Node 20+).
 */
export function parcheReleaseParaOnnxWeb(): () => void {
  const original = process.release;
  if (!original?.name || original.name !== "node") return () => {};

  const descriptor = Object.getOwnPropertyDescriptor(process, "release");
  Object.defineProperty(process, "release", {
    configurable: true,
    enumerable: descriptor?.enumerable ?? true,
    get() {
      return { ...original, name: "serverless" };
    },
  });

  return () => {
    if (descriptor) {
      Object.defineProperty(process, "release", descriptor);
    }
  };
}

export function carpetaCacheClip(): string {
  if (esEntornoServerless()) {
    return join(tmpdir(), "pawpatroll-clip-cache");
  }
  return join(process.cwd(), ".cache", "transformers");
}

function rutaWasmLocal(): string {
  return (
    join(process.cwd(), "node_modules", "@xenova", "transformers", "dist")
      .replace(/\\/g, "/") + "/"
  );
}

export function configurarEnvTransformers(
  mod: typeof import("@xenova/transformers")
): void {
  const serverless = esEntornoServerless();

  mod.env.allowLocalModels = true;
  mod.env.allowRemoteModels = true;
  mod.env.useBrowserCache = false;
  mod.env.useFSCache = !serverless;
  mod.env.cacheDir = carpetaCacheClip();

  const wasm = mod.env.backends.onnx?.wasm;
  if (wasm) {
    wasm.numThreads = 1;
    wasm.wasmPaths = serverless
      ? `https://cdn.jsdelivr.net/npm/@xenova/transformers@${mod.env.version}/dist/`
      : rutaWasmLocal();
  }
}
