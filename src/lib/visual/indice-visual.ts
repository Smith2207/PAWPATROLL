import { and, desc, eq, inArray, notInArray } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { db } from "@/lib/db";
import {
  mascotaEmbeddings,
  mascotaFotos,
  mascotas,
} from "@/lib/db/schema";
import { umbralesVisual } from "@/lib/visual/config";
import {
  puntuacionConRerank,
  type FiltrosBusquedaVisual,
} from "@/lib/visual/rerank";
import {
  coseno,
  embeddingApiConfigurada,
  embeddingDesdeDataUrl,
  modeloEmbeddingActivo,
  proveedorVisualActivo,
} from "@/lib/visual/embedding";
import type { CoincidenciaVisual, ResultadoBusquedaVisual } from "@/lib/visual/tipos";

function sqlNeon() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL.");
  return neon(url);
}

function vectorAPg(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

export async function guardarEmbeddingFoto(
  mascotaId: string,
  fotoId: string,
  vector: number[],
  modelo: string,
  descripcionAi?: string
): Promise<void> {
  const json = JSON.stringify(vector);
  await db
    .insert(mascotaEmbeddings)
    .values({
      mascotaId,
      fotoId,
      embedding: json,
      modelo,
      descripcionAi: descripcionAi ?? null,
    })
    .onConflictDoUpdate({
      target: [mascotaEmbeddings.mascotaId, mascotaEmbeddings.fotoId],
      set: {
        embedding: json,
        modelo,
        descripcionAi: descripcionAi ?? null,
        updatedAt: new Date(),
      },
    });

  try {
    const sql = sqlNeon();
    await sql`
      UPDATE mascota_embedding
      SET embedding_vec = ${vectorAPg(vector)}::vector,
          descripcion_ai = ${descripcionAi ?? null}
      WHERE mascota_id = ${mascotaId} AND foto_id = ${fotoId}
    `;
  } catch {
    /* pgvector opcional */
  }
}

export async function eliminarEmbeddingsMascota(mascotaId: string): Promise<void> {
  await db
    .delete(mascotaEmbeddings)
    .where(eq(mascotaEmbeddings.mascotaId, mascotaId));
}

async function fotosIndexables(mascotaId: string) {
  const max = umbralesVisual().maxFotosPorMascota;
  const filas = await db
    .select({
      id: mascotaFotos.id,
      url: mascotaFotos.url,
      esPrincipal: mascotaFotos.esPrincipal,
      orden: mascotaFotos.orden,
    })
    .from(mascotaFotos)
    .where(eq(mascotaFotos.mascotaId, mascotaId))
    .orderBy(desc(mascotaFotos.esPrincipal), mascotaFotos.orden);

  return filas
    .filter((f) => f.url.startsWith("data:image/"))
    .slice(0, max);
}

/** Indexa hasta N fotos de la mascota si está PERDIDA */
export async function sincronizarEmbeddingMascota(
  mascotaId: string
): Promise<{ ok: boolean; error?: string; fotosIndexadas?: number }> {
  if (!embeddingApiConfigurada()) {
    return {
      ok: false,
      error: "La búsqueda por foto no está disponible en este momento.",
    };
  }

  const [m] = await db
    .select({ estado: mascotas.estado })
    .from(mascotas)
    .where(eq(mascotas.id, mascotaId))
    .limit(1);

  if (!m) return { ok: false, error: "Mascota no encontrada." };
  if (m.estado !== "PERDIDA") {
    await eliminarEmbeddingsMascota(mascotaId);
    return { ok: true, fotosIndexadas: 0 };
  }

  const fotos = await fotosIndexables(mascotaId);
  if (fotos.length === 0) {
    await eliminarEmbeddingsMascota(mascotaId);
    return { ok: false, error: "Sin fotos en data URL para indexar." };
  }

  const fotosOk: string[] = [];
  let indexadas = 0;
  for (const foto of fotos) {
    try {
      const { vector, modelo, descripcion } = await embeddingDesdeDataUrl(foto.url);
      await guardarEmbeddingFoto(
        mascotaId,
        foto.id,
        vector,
        modelo,
        descripcion
      );
      fotosOk.push(foto.id);
      indexadas++;
    } catch (e) {
      console.warn(`[visual/${proveedorVisualActivo()}] foto ${foto.id}:`, e);
    }
  }

  if (indexadas === 0) {
    return {
      ok: false,
      error:
        "No se pudo indexar ninguna foto (revisa credenciales Gemini en Vercel).",
    };
  }

  await db
    .delete(mascotaEmbeddings)
    .where(
      and(
        eq(mascotaEmbeddings.mascotaId, mascotaId),
        notInArray(mascotaEmbeddings.fotoId, fotosOk)
      )
    );

  return { ok: true, fotosIndexadas: indexadas };
}

function porcentajeRelativo(cosenoVal: number, mejor: number): number {
  if (mejor <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((cosenoVal / mejor) * 100)));
}

type FilaBusqueda = {
  mascotaId: string;
  fotoId: string;
  embedding: string;
  modelo: string;
  nombre: string;
  slug: string;
  tipo: string | null;
  color: string | null;
  latPerdida: string | number | null;
  lngPerdida: string | number | null;
  coseno: number;
};

/** Búsqueda rápida con pgvector (<=> coseno) en Neon. */
async function buscarConPgvector(
  consulta: number[],
  modelo: string,
  limite: number,
  minCoseno: number
): Promise<FilaBusqueda[] | null> {
  try {
    const sql = sqlNeon();
    const vec = vectorAPg(consulta);
    const rows = await sql`
      SELECT
        me.mascota_id AS "mascotaId",
        me.foto_id AS "fotoId",
        me.embedding,
        me.modelo,
        m.nombre,
        m.slug,
        m.tipo,
        m.color,
        m.lat_perdida AS "latPerdida",
        m.lng_perdida AS "lngPerdida",
        1 - (me.embedding_vec <=> ${vec}::vector) AS coseno
      FROM mascota_embedding me
      INNER JOIN mascota m ON m.id = me.mascota_id
      WHERE m.estado = 'PERDIDA'
        AND me.modelo = ${modelo}
        AND me.embedding_vec IS NOT NULL
      ORDER BY me.embedding_vec <=> ${vec}::vector
      LIMIT ${Math.max(limite * 4, 32)}
    `;
    const filtradas = (rows as FilaBusqueda[]).filter(
      (r) => Number(r.coseno) >= minCoseno
    );
    return filtradas.length > 0 ? filtradas : [];
  } catch {
    return null;
  }
}

export async function buscarSimilaresPorFoto(
  dataUrl: string,
  limite = 8,
  filtros?: FiltrosBusquedaVisual
): Promise<ResultadoBusquedaVisual> {
  if (!embeddingApiConfigurada()) {
    return {
      ok: false,
      error: "La búsqueda por foto no está disponible en este momento.",
    };
  }

  const { minCoseno, gapMinimo } = umbralesVisual();
  const modeloEsperado = await modeloEmbeddingActivo();

  const filas = await db
    .select({
      mascotaId: mascotaEmbeddings.mascotaId,
      fotoId: mascotaEmbeddings.fotoId,
      embedding: mascotaEmbeddings.embedding,
      modelo: mascotaEmbeddings.modelo,
      nombre: mascotas.nombre,
      slug: mascotas.slug,
      tipo: mascotas.tipo,
      color: mascotas.color,
      latPerdida: mascotas.latPerdida,
      lngPerdida: mascotas.lngPerdida,
    })
    .from(mascotaEmbeddings)
    .innerJoin(mascotas, eq(mascotas.id, mascotaEmbeddings.mascotaId))
    .where(eq(mascotas.estado, "PERDIDA"));

  if (filas.length === 0) {
    return { ok: true, coincidencias: [], indiceVacio: true };
  }

  const filasCompatibles = filas.filter((f) => f.modelo === modeloEsperado);
  if (filasCompatibles.length === 0) {
    return {
      ok: true,
      coincidencias: [],
      indiceVacio: filas.length === 0,
      error:
        filas.length > 0
          ? "Estamos preparando las fotos para la búsqueda. Vuelve a intentarlo en unos minutos."
          : undefined,
    };
  }

  let consulta: number[];
  let modeloUsado: string;
  try {
    const r = await embeddingDesdeDataUrl(dataUrl);
    consulta = r.vector;
    modeloUsado = r.modelo;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al analizar la foto.",
    };
  }

  const pgFilas = await buscarConPgvector(
    consulta,
    modeloEsperado,
    limite,
    minCoseno
  );

  const mejorPorMascota = new Map<
    string,
    { fila: FilaBusqueda; coseno: number; puntuacion: number }
  >();

  if (pgFilas !== null && pgFilas.length > 0) {
    for (const fila of pgFilas) {
      const sim = Number(fila.coseno);
      const puntuacion = puntuacionConRerank(sim, fila, filtros);
      const prev = mejorPorMascota.get(fila.mascotaId);
      if (!prev || puntuacion > prev.puntuacion) {
        mejorPorMascota.set(fila.mascotaId, { fila, coseno: sim, puntuacion });
      }
    }
  } else {
    for (const fila of filasCompatibles) {
      let vec: number[];
      try {
        vec = JSON.parse(fila.embedding) as number[];
      } catch {
        continue;
      }
      if (vec.length !== consulta.length) continue;

      const sim = await coseno(consulta, vec);
      if (sim < minCoseno) continue;

      const puntuacion = puntuacionConRerank(sim, fila, filtros);
      const prev = mejorPorMascota.get(fila.mascotaId);
      if (!prev || puntuacion > prev.puntuacion) {
        mejorPorMascota.set(fila.mascotaId, {
          fila: { ...fila, fotoId: fila.fotoId, coseno: sim },
          coseno: sim,
          puntuacion,
        });
      }
    }
  }

  const puntuadas = [...mejorPorMascota.values()].sort(
    (a, b) => b.puntuacion - a.puntuacion
  );

  const top = puntuadas.slice(0, limite);
  if (top.length === 0) {
    return { ok: true, coincidencias: [], modelo: modeloUsado };
  }

  const mejorCoseno = top[0]!.coseno;
  if (top.length > 1 && mejorCoseno - top[1]!.coseno < gapMinimo) {
    top.splice(1);
  }

  const ids = top.map((t) => t.fila.mascotaId);
  const fotoIds = top.map((t) => t.fila.fotoId).filter(Boolean) as string[];

  const fotos = await db
    .select({
      mascotaId: mascotaFotos.mascotaId,
      url: mascotaFotos.url,
      esPrincipal: mascotaFotos.esPrincipal,
      orden: mascotaFotos.orden,
    })
    .from(mascotaFotos)
    .where(inArray(mascotaFotos.mascotaId, ids));

  const fotoPorId = new Map<string, string>();
  for (const id of ids) {
    const delMascota = fotos
      .filter((f) => f.mascotaId === id)
      .sort(
        (a, b) =>
          Number(b.esPrincipal) - Number(a.esPrincipal) || a.orden - b.orden
      );
    if (delMascota[0]?.url) fotoPorId.set(id, delMascota[0].url);
  }

  const descripciones = fotoIds.length
    ? await db
        .select({
          fotoId: mascotaEmbeddings.fotoId,
          descripcionAi: mascotaEmbeddings.descripcionAi,
        })
        .from(mascotaEmbeddings)
        .where(inArray(mascotaEmbeddings.fotoId, fotoIds))
    : [];

  const descripcionPorFoto = new Map(
    descripciones.map((d) => [d.fotoId, d.descripcionAi])
  );

  const coincidencias: CoincidenciaVisual[] = top.map((t) => ({
    mascotaId: t.fila.mascotaId,
    nombre: t.fila.nombre,
    slug: t.fila.slug,
    fotoUrl: fotoPorId.get(t.fila.mascotaId) ?? null,
    similitud: porcentajeRelativo(t.coseno, mejorCoseno),
    modelo: t.fila.modelo,
    descripcionAi: descripcionPorFoto.get(t.fila.fotoId) ?? null,
  }));

  return { ok: true, coincidencias, modelo: modeloUsado };
}
