/**
 * Aplica una migración SQL de drizzle/ por número (ej. 0015 o 15).
 *
 * Uso: node scripts/aplicar-migracion.mjs 0015
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const raw = process.argv[2]?.trim();
if (!raw) {
  console.error("Uso: node scripts/aplicar-migracion.mjs <número>");
  console.error("Ejemplo: node scripts/aplicar-migracion.mjs 0015");
  process.exit(1);
}

const numero = raw.replace(/^0+/, "") || "0";
const prefijo = numero.padStart(4, "0");
const drizzleDir = join(__dirname, "..", "drizzle");
const archivoSql = readdirSync(drizzleDir).find((f) => f.startsWith(`${prefijo}_`));

if (!archivoSql) {
  console.error(`No se encontró migración ${prefijo}_*.sql en drizzle/`);
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL en .env.local");
  process.exit(1);
}

const sql = neon(url);
const contenido = readFileSync(join(drizzleDir, archivoSql), "utf8");
const sentencias = contenido
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

console.log(`Aplicando ${archivoSql}…`);

for (const sentencia of sentencias) {
  console.log("Ejecutando:", sentencia.slice(0, 72) + "…");
  try {
    await sql.query(sentencia, []);
  } catch (e) {
    console.warn("Aviso:", e.message?.slice(0, 200));
  }
}

console.log(`Migración ${prefijo} aplicada.`);
