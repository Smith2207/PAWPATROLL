import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL en .env.local");
  process.exit(1);
}

const sql = neon(url);
const archivo = readFileSync(
  join(__dirname, "..", "drizzle", "0011_usuario_activo.sql"),
  "utf8"
);

const sentencias = archivo
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const sentencia of sentencias) {
  console.log("Ejecutando:", sentencia.slice(0, 70) + "…");
  try {
    await sql.query(sentencia, []);
  } catch (e) {
    console.warn("Aviso:", e.message?.slice(0, 160));
  }
}

console.log("Migración 0011 aplicada (usuario activo).");
