"use server";

import { db } from "@/lib/db";
import { avistamientos, mascotas, users } from "@/lib/db/schema";
import { and, desc, eq, ne, sql } from "drizzle-orm";

export type ActividadComunidad = {
  id: string;
  tipo: "avistamiento" | "reunion";
  titulo: string;
  subtitulo: string;
  fecha: Date;
  slug?: string;
};

export type ColaboradorDestacado = {
  userId: string;
  nombre: string;
  avistamientosVerificados: number;
  badge: "vecino" | "ayudante" | null;
};

function nombrePublico(nombre: string | null | undefined): string {
  if (!nombre?.trim()) return "Un vecino";
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0]!;
  return `${partes[0]} ${partes[1]![0]}.`;
}

export async function listarActividadComunidad(
  limite = 8
): Promise<ActividadComunidad[]> {
  const filas = await db
    .select({
      id: avistamientos.id,
      direccion: avistamientos.direccion,
      createdAt: avistamientos.createdAt,
      nombreMascota: mascotas.nombre,
      slug: mascotas.slug,
      nombreUsuario: users.name,
    })
    .from(avistamientos)
    .leftJoin(mascotas, eq(avistamientos.mascotaId, mascotas.id))
    .leftJoin(users, eq(avistamientos.userId, users.id))
    .where(ne(avistamientos.estado, "DESCARTADO"))
    .orderBy(desc(avistamientos.createdAt))
    .limit(limite);

  const actividades: ActividadComunidad[] = filas.map((f) => ({
    id: f.id,
    tipo: "avistamiento" as const,
    titulo: f.nombreMascota
      ? `${nombrePublico(f.nombreUsuario)} reportó un avistamiento`
      : `${nombrePublico(f.nombreUsuario)} reportó una mascota en la calle`,
    subtitulo: f.direccion?.trim() || "Ubicación en el mapa",
    fecha: f.createdAt,
    slug: f.slug ?? undefined,
  }));

  const reunidas = await db
    .select({
      id: mascotas.id,
      nombre: mascotas.nombre,
      slug: mascotas.slug,
      updatedAt: mascotas.updatedAt,
    })
    .from(mascotas)
    .where(eq(mascotas.estado, "REUNIDA"))
    .orderBy(desc(mascotas.updatedAt))
    .limit(3);

  for (const m of reunidas) {
    actividades.push({
      id: `reunion-${m.id}`,
      tipo: "reunion",
      titulo: `🎉 ${m.nombre} volvió a casa`,
      subtitulo: "Caso marcado como reunido",
      fecha: m.updatedAt,
      slug: m.slug,
    });
  }

  return actividades
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
    .slice(0, limite);
}

export async function listarTopColaboradores(
  limite = 5
): Promise<ColaboradorDestacado[]> {
  const filas = await db
    .select({
      userId: avistamientos.userId,
      nombre: users.name,
      total: sql<number>`count(*)::int`,
    })
    .from(avistamientos)
    .innerJoin(users, eq(avistamientos.userId, users.id))
    .where(eq(avistamientos.estado, "VERIFICADO"))
    .groupBy(avistamientos.userId, users.name)
    .orderBy(sql`count(*) desc`)
    .limit(limite);

  return filas
    .filter((f) => f.userId)
    .map((f) => {
      const n = f.total;
      let badge: ColaboradorDestacado["badge"] = null;
      if (n >= 3) badge = "ayudante";
      else if (n >= 1) badge = "vecino";
      return {
        userId: f.userId!,
        nombre: nombrePublico(f.nombre),
        avistamientosVerificados: n,
        badge,
      };
    });
}
