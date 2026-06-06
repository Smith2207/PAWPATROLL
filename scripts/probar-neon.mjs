import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("ERR: DATABASE_URL no definida en .env.local");
  process.exit(1);
}

try {
  const sql = neon(url);
  const rows = await sql`SELECT 1 AS ok`;
  console.log("OK: conexión Neon correcta", rows);
} catch (e) {
  console.error("ERR:", e.message);
  process.exit(1);
}
