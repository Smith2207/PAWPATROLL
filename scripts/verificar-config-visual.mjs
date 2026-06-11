/**
 * Verifica que scripts/lib/*.mjs y src/lib/visual/config.ts comparten las mismas constantes.
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  MODELO_GEMINI_EMBEDDING,
  MODELO_GEMINI_VISION,
  PROMPT_DESCRIPCION_MASCOTA_GEMINI,
} from "./lib/gemini-config.mjs";
import {
  DIMENSION_CLIP,
  MODELO_CLIP,
  MODELO_XENOVA_LOCAL as MODELO_XENOVA_CLI,
} from "./lib/clip-config.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const configTs = readFileSync(
  join(raiz, "src/lib/visual/config.ts"),
  "utf8"
);

function extraerConstString(nombre) {
  const re = new RegExp(
    `export const ${nombre} = \`([\\s\\S]*?)\`;`,
    "m"
  );
  const m = configTs.match(re);
  return m?.[1]?.trim() ?? null;
}

function extraerConstLiteral(nombre) {
  const re = new RegExp(`export const ${nombre} = (.+?);`, "m");
  const m = configTs.match(re);
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, "");
}

function extraerDefaultEnv(nombre, fallback) {
  const re = new RegExp(
    `export const ${nombre}[\\s\\S]*?\\|\\|\\s*["']([^"']+)["']`,
    "m"
  );
  const m = configTs.match(re);
  return m?.[1] ?? fallback;
}

const errores = [];

function normalizarTexto(s) {
  return s.replace(/\r\n/g, "\n").trim();
}

const promptTs = extraerConstString("PROMPT_DESCRIPCION_MASCOTA_GEMINI");
if (
  normalizarTexto(promptTs ?? "") !==
  normalizarTexto(PROMPT_DESCRIPCION_MASCOTA_GEMINI)
) {
  errores.push("PROMPT_DESCRIPCION_MASCOTA_GEMINI difiere entre TS y gemini-config.mjs");
}

const clipTs = extraerConstLiteral("MODELO_CLIP");
if (clipTs !== MODELO_CLIP) {
  errores.push(`MODELO_CLIP: TS="${clipTs}" vs mjs="${MODELO_CLIP}"`);
}

const dimTs = extraerConstLiteral("DIMENSION_CLIP");
if (dimTs !== String(DIMENSION_CLIP)) {
  errores.push(`DIMENSION_CLIP: TS="${dimTs}" vs mjs="${DIMENSION_CLIP}"`);
}

const xenovaTs = extraerDefaultEnv(
  "MODELO_XENOVA_LOCAL",
  "Xenova/clip-vit-base-patch32"
);
if (xenovaTs !== MODELO_XENOVA_CLI) {
  errores.push(
    `MODELO_XENOVA_LOCAL (default): TS="${xenovaTs}" vs mjs="${MODELO_XENOVA_CLI}"`
  );
}

const visionTs = extraerDefaultEnv("MODELO_GEMINI_VISION", "gemini-2.5-flash");
if (visionTs !== MODELO_GEMINI_VISION) {
  errores.push(
    `MODELO_GEMINI_VISION (default): TS="${visionTs}" vs mjs="${MODELO_GEMINI_VISION}"`
  );
}

const embedTs = extraerDefaultEnv(
  "MODELO_GEMINI_EMBEDDING",
  "gemini-embedding-2-preview"
);
if (embedTs !== MODELO_GEMINI_EMBEDDING) {
  errores.push(
    `MODELO_GEMINI_EMBEDDING (default): TS="${embedTs}" vs mjs="${MODELO_GEMINI_EMBEDDING}"`
  );
}

if (errores.length > 0) {
  console.error("Config visual desalineada:\n");
  for (const e of errores) console.error(`  • ${e}`);
  process.exit(1);
}

console.log("OK: config visual TS ↔ scripts alineada.");
