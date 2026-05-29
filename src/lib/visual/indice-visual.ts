import { and, desc, eq, inArray } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { db } from "@/lib/db";
import {
  mascotaEmbeddings,
  mascotaFotos,
  mascotas,
} from "@/lib/db/schema";
import { umbralesClip } from "@/lib/visual/config";
import {
  clipApiConfigurada,
  coseno,
  embeddingDesdeDataUrl,
} from "@/lib/visual/clip-embedding";
import {
  puntuacionConRerank,
  type FiltrosBusquedaVisual,
} from "@/lib/visual/rerank";
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
  modelo: string
): Promise<void> {
  const json = JSON.stringify(vector);
  await db
    .insert(mascotaEmbeddings)
    .values({ mascotaId, fotoId, embedding: json, modelo })
    .onConflictDoUpdate({
      target: [mascotaEmbeddings.mascotaId, mascotaEmbeddings.fotoId],
      set: { embedding: json, modelo, updatedAt: new Date() },
    });

  try {
    const sql = sqlNeon();
    await sql`
      UPDATE mascota_embedding
      SET embedding_vec = ${vectorAPg(vector)}::vector
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
  const max = umbralesClip().maxFotosPorMascota;
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
  if (!clipApiConfigurada()) {
    return { ok: false, error: "CLIP local no disponible en este entorno." };
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

  await eliminarEmbeddingsMascota(mascotaId);

  let indexadas = 0;
  for (const foto of fotos) {
    try {
      const { vector, modelo } = await embeddingDesdeDataUrl(foto.url);
      await guardarEmbeddingFoto(mascotaId, foto.id, vector, modelo);
      indexadas++;
    } catch (e) {
      console.warn(`[clip] foto ${foto.id}:`, e);
    }
  }

  if (indexadas === 0) {
    return { ok: false, error: "No se pudo indexar ninguna foto." };
  }

  return { ok: true, fotosIndexadas: indexadas };
}

function porcentajeRelativo(cosenoVal: number, mejor: number): number {
  if (mejor <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((cosenoVal / mejor) * 100)));
}

export async function buscarSimilaresPorFoto(
  dataUrl: string,
  limite = 8,
  filtros?: FiltrosBusquedaVisual
): Promise<ResultadoBusquedaVisual> {
  if (!clipApiConfigurada()) {
    return {
      ok: false,
      error: "La búsqueda por foto solo está disponible en el servidor Node.",
    };
  }

  const { minCoseno, gapMinimo } = umbralesClip();

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

  const mejorPorMascota = new Map<
    string,
    {
      fila: (typeof filas)[0];
      coseno: number;
      puntuacion: number;
    }
  >();

  for (const fila of filas) {
    let vec: number[];
    try {
      vec = JSON.parse(fila.embedding) as number[];
    } catch {
      continue;
    }
    const sim = coseno(consulta, vec);
    if (sim < minCoseno) continue;

    const puntuacion = puntuacionConRerank(sim, fila, filtros);
    const prev = mejorPorMascota.get(fila.mascotaId);
    if (!prev || puntuacion > prev.puntuacion) {
      mejorPorMascota.set(fila.mascotaId, { fila, coseno: sim, puntuacion });
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

  const coincidencias: CoincidenciaVisual[] = top.map((t) => ({
    mascotaId: t.fila.mascotaId,
    nombre: t.fila.nombre,
    slug: t.fila.slug,
    fotoUrl: fotoPorId.get(t.fila.mascotaId) ?? null,
    similitud: porcentajeRelativo(t.coseno, mejorCoseno),
    modelo: t.fila.modelo,
  }));

  return { ok: true, coincidencias, modelo: modeloUsado };
}
