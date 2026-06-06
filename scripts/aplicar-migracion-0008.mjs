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
  join(__dirname, "..", "drizzle", "0008_acceso_exterior.sql"),
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
    const msg = e.message ?? String(e);
    if (
      msg.includes("already exists") ||
      msg.includes("duplicate") ||
      msg.includes("42710")
    ) {
      console.warn("  (ya existía, se omite)");
    } else {
      throw e;
    }
  }
}

console.log("Migración 0008_acceso_exterior aplicada correctamente.");
