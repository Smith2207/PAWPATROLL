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
 * En serverless forzamos la rama WASM (onnxruntime-web).
 */
export function parcheReleaseParaWasmEnServerless(): () => void {
  if (!esEntornoServerless()) return () => {};

  const rel = process.release;
  if (!rel || rel.name !== "node") return () => {};

  const anterior = rel.name;
  (rel as { name: string }).name = "serverless";

  return () => {
    (rel as { name: string }).name = anterior;
  };
}

export function carpetaCacheClip(): string {
  if (esEntornoServerless()) {
    return join(tmpdir(), "pawpatroll-clip-cache");
  }
  return join(process.cwd(), ".cache", "transformers");
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
    wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/@xenova/transformers@${mod.env.version}/dist/`;
  }
}
