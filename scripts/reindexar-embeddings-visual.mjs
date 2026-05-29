/**
 * Reindexa fotos de mascotas PERDIDAS con el proveedor visual activo (Gemini o CLIP).
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const maxFotos = Math.min(
  10,
  Math.max(
    1,
    Number(
      process.env.VISUAL_MAX_FOTOS_INDEX ??
        process.env.CLIP_MAX_FOTOS_INDEX ??
        "5"
    )
  )
);

function proveedor() {
  const modo = process.env.VISUAL_PROVIDER?.trim().toLowerCase();
  if (modo === "clip") return "clip";
  if (modo === "gemini") return "gemini";
  const tieneGemini =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
    process.env.GCP_PROJECT_ID?.trim();
  return tieneGemini ? "gemini" : "clip";
}

const prov = proveedor();
const { embeddingDesdeDataUrl, MODELO_CLIP, carpetaCacheModelo } =
  prov === "gemini"
    ? await import("./lib/gemini-embedding.mjs")
    : await import("./lib/clip-local.mjs");

const modeloLabel =
  prov === "gemini"
    ? process.env.GEMINI_EMBEDDING_MODEL?.trim() || "gemini-embedding-2"
    : MODELO_CLIP;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL");
  process.exit(1);
}

if (prov === "gemini") {
  const { geminiEmbeddingConfigurada } = await import("./lib/gemini-embedding.mjs");
  if (!geminiEmbeddingConfigurada()) {
    console.error(
      "Gemini no configurado. Añade GOOGLE_CLOUD_PROJECT y ADC (gcloud auth application-default login)."
    );
    process.exit(1);
  }
}

const sql = neon(url);

const filas = await sql`
  SELECT m.id AS mascota_id, m.nombre, f.id AS foto_id, f.url, f.es_principal, f.orden
  FROM mascota m
  INNER JOIN mascota_foto f ON f.mascota_id = m.id
  WHERE m.estado = 'PERDIDA'
    AND f.url LIKE 'data:image/%'
  ORDER BY m.nombre, f.es_principal DESC, f.orden ASC
`;

const porMascota = new Map();
for (const row of filas) {
  if (!porMascota.has(row.mascota_id)) porMascota.set(row.mascota_id, []);
  const lista = porMascota.get(row.mascota_id);
  if (lista.length < maxFotos) lista.push(row);
}

const totalFotos = [...porMascota.values()].reduce((n, a) => n + a.length, 0);

console.log(`Proveedor: ${prov}`);
console.log(`Modelo:    ${modeloLabel}`);
if (prov === "clip") console.log(`Cache:     ${carpetaCacheModelo}`);
console.log(`Mascotas:  ${porMascota.size} · Fotos: ${totalFotos}`);

if (totalFotos === 0) {
  console.log("Nada que indexar.");
  process.exit(0);
}

let ok = 0;
let fallos = 0;
let n = 0;

for (const [, fotos] of porMascota) {
  const mascotaId = fotos[0].mascota_id;
  const nombre = fotos[0].nombre;
  await sql`DELETE FROM mascota_embedding WHERE mascota_id = ${mascotaId}`;

  for (const foto of fotos) {
    n++;
    process.stdout.write(
      `[${n}/${totalFotos}] ${nombre} (foto ${foto.orden})… `
    );
    try {
      const { vector, modelo, descripcion } = await embeddingDesdeDataUrl(foto.url);
      const json = JSON.stringify(vector);
      const id = crypto.randomUUID();
      const vecPg = `[${vector.join(",")}]`;

      await sql`
        INSERT INTO mascota_embedding (id, mascota_id, foto_id, embedding, modelo, descripcion_ai, updated_at)
        VALUES (${id}, ${mascotaId}, ${foto.foto_id}, ${json}, ${modelo}, ${descripcion ?? null}, now())
        ON CONFLICT (mascota_id, foto_id) DO UPDATE SET
          embedding = EXCLUDED.embedding,
          modelo = EXCLUDED.modelo,
          descripcion_ai = EXCLUDED.descripcion_ai,
          updated_at = now()
      `;

      try {
        await sql`
          UPDATE mascota_embedding
          SET embedding_vec = ${vecPg}::vector
          WHERE mascota_id = ${mascotaId} AND foto_id = ${foto.foto_id}
        `;
      } catch {
        /* pgvector opcional */
      }

      console.log("OK");
      ok++;
    } catch (e) {
      console.log(`ERROR: ${e instanceof Error ? e.message : e}`);
      fallos++;
    }
  }
}

console.log(`\nListo: ${ok} fotos indexadas, ${fallos} fallos.`);
