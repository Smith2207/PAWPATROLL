"use server";

import { and, count, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  avistamientos,
  mascotaFotos,
  mascotas,
  users,
  type EstadoMascota,
} from "@/lib/db/schema";
import { esFichaPublica } from "@/lib/mascotas/estados";
import {
  esTipoMascotaPermitido,
  type TipoMascota,
} from "@/lib/mascotas/tipos";
import { sesionUsuario } from "@/lib/auth/sesion-servidor";
import {
  adjuntarFotoPrincipal,
  soloPerrosYGatos,
} from "@/actions/mascotas/helpers";

export type FiltrosBusquedaMascotasPublicas = {
  q?: string;
  /** Filtros rápidos (valores en BD: Perro, Gato) */
  tipo?: TipoMascota;
  /** Días hacia atrás desde hoy (ej. 1 = últimas 24 h) */
  dias?: number;
  limite?: number;
};

type MascotaPublicaLista = {
  id: string;
  slug: string;
  nombre: string;
  tipo: string;
  raza: string | null;
  sexo: string | null;
  edad: string | null;
  color: string | null;
  estado: EstadoMascota;
  lugarPerdida: string | null;
  fechaPerdida: Date | null;
  updatedAt: Date;
  fotoPrincipal: string | null;
};

export async function listarMisMascotas() {
  const userId = await sesionUsuario();
  if (!userId) return [];

  const lista = await db
    .select()
    .from(mascotas)
    .where(and(eq(mascotas.userId, userId), soloPerrosYGatos()))
    .orderBy(desc(mascotas.updatedAt));

  if (lista.length === 0) return [];

  const ids = lista.map((m) => m.id);
  const fotos = await db
    .select()
    .from(mascotaFotos)
    .where(inArray(mascotaFotos.mascotaId, ids))
    .orderBy(mascotaFotos.orden);

  const fotoPrincipal = new Map<string, string>();
  for (const f of fotos) {
    if (f.esPrincipal && !fotoPrincipal.has(f.mascotaId)) {
      fotoPrincipal.set(f.mascotaId, f.url);
    }
  }
  for (const f of fotos) {
    if (!fotoPrincipal.has(f.mascotaId)) {
      fotoPrincipal.set(f.mascotaId, f.url);
    }
  }

  const pendientesRows = await db
    .select({
      mascotaId: avistamientos.mascotaId,
      total: count(),
    })
    .from(avistamientos)
    .where(
      and(
        inArray(avistamientos.mascotaId, ids),
        eq(avistamientos.estado, "PENDIENTE")
      )
    )
    .groupBy(avistamientos.mascotaId);

  const totalAvistRows = await db
    .select({
      mascotaId: avistamientos.mascotaId,
      total: count(),
    })
    .from(avistamientos)
    .where(inArray(avistamientos.mascotaId, ids))
    .groupBy(avistamientos.mascotaId);

  const pendientesPorMascota = new Map(
    pendientesRows
      .filter((r): r is { mascotaId: string; total: number } => Boolean(r.mascotaId))
      .map((r) => [r.mascotaId, Number(r.total)])
  );

  const totalAvistPorMascota = new Map(
    totalAvistRows
      .filter((r): r is { mascotaId: string; total: number } => Boolean(r.mascotaId))
      .map((r) => [r.mascotaId, Number(r.total)])
  );

  return lista.map((m) => ({
    ...m,
    fotoPrincipal: fotoPrincipal.get(m.id) ?? null,
    avistamientosPendientes: pendientesPorMascota.get(m.id) ?? 0,
    totalAvistamientos: totalAvistPorMascota.get(m.id) ?? 0,
  }));
}

export async function buscarMascotasPublicas(
  filtros: FiltrosBusquedaMascotasPublicas = {}
): Promise<MascotaPublicaLista[]> {
  const limite = Math.min(Math.max(filtros.limite ?? 24, 1), 48);
  const condiciones = [
    inArray(mascotas.estado, ["PERDIDA", "ENCONTRADA"]),
    soloPerrosYGatos(),
  ];

  if (filtros.tipo && esTipoMascotaPermitido(filtros.tipo)) {
    condiciones.push(eq(mascotas.tipo, filtros.tipo));
  }

  if (filtros.dias && filtros.dias > 0) {
    const desde = new Date();
    desde.setDate(desde.getDate() - filtros.dias);
    condiciones.push(
      gte(sql`COALESCE(${mascotas.fechaPerdida}, ${mascotas.updatedAt})`, desde)
    );
  }

  const q = filtros.q?.trim();
  if (q) {
    const patron = `%${q.replace(/[%_]/g, "")}%`;
    condiciones.push(
      or(
        ilike(mascotas.nombre, patron),
        ilike(mascotas.tipo, patron),
        ilike(mascotas.raza, patron),
        ilike(mascotas.color, patron),
        ilike(mascotas.lugarPerdida, patron),
        ilike(mascotas.descripcion, patron)
      )!
    );
  }

  const lista = await db
    .select({
      id: mascotas.id,
      slug: mascotas.slug,
      nombre: mascotas.nombre,
      tipo: mascotas.tipo,
      raza: mascotas.raza,
      sexo: mascotas.sexo,
      edad: mascotas.edad,
      color: mascotas.color,
      estado: mascotas.estado,
      lugarPerdida: mascotas.lugarPerdida,
      fechaPerdida: mascotas.fechaPerdida,
      updatedAt: mascotas.updatedAt,
    })
    .from(mascotas)
    .where(and(...condiciones))
    .orderBy(desc(mascotas.updatedAt))
    .limit(limite);

  return adjuntarFotoPrincipal(lista);
}

export async function listarMascotasPerdidasPublicas(limite = 8) {
  return buscarMascotasPublicas({ limite });
}

export async function obtenerMascotaPropia(id: string) {
  const userId = await sesionUsuario();
  if (!userId) return null;

  const [mascota] = await db
    .select()
    .from(mascotas)
    .where(and(eq(mascotas.id, id), eq(mascotas.userId, userId)))
    .limit(1);

  if (!mascota || !esTipoMascotaPermitido(mascota.tipo)) return null;

  const fotos = await db
    .select()
    .from(mascotaFotos)
    .where(eq(mascotaFotos.mascotaId, id))
    .orderBy(mascotaFotos.orden);

  const [pendientesRow] = await db
    .select({ total: count() })
    .from(avistamientos)
    .where(
      and(
        eq(avistamientos.mascotaId, id),
        eq(avistamientos.estado, "PENDIENTE")
      )
    );

  const [totalAvistRow] = await db
    .select({ total: count() })
    .from(avistamientos)
    .where(eq(avistamientos.mascotaId, id));

  return {
    mascota: {
      ...mascota,
      avistamientosPendientes: Number(pendientesRow?.total ?? 0),
      totalAvistamientos: Number(totalAvistRow?.total ?? 0),
    },
    fotos,
  };
}

export async function obtenerMascotaPublica(slug: string) {
  const [fila] = await db
    .select({
      mascota: mascotas,
      duenoNombre: users.name,
    })
    .from(mascotas)
    .innerJoin(users, eq(mascotas.userId, users.id))
    .where(eq(mascotas.slug, slug))
    .limit(1);

  if (!fila || !esFichaPublica(fila.mascota.estado)) {
    return null;
  }

  if (!esTipoMascotaPermitido(fila.mascota.tipo)) {
    return null;
  }

  const fotos = await db
    .select()
    .from(mascotaFotos)
    .where(eq(mascotaFotos.mascotaId, fila.mascota.id))
    .orderBy(mascotaFotos.orden);

  return {
    mascota: fila.mascota,
    duenoNombre: fila.duenoNombre,
    fotos,
  };
}
