"use server";

import { and, count, desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { avistamientos, mascotas } from "@/lib/db/schema";
import { TIPOS_MASCOTA } from "@/lib/mascotas/tipos";

export type ResumenCasosNav = {
  /** Destino al pulsar «Mis mascotas» (caso directo si aplica). */
  href: string;
  pendientes: number;
  perdidas: number;
};

/** Destino inteligente para «Mis mascotas» en nav (sin cargar fotos base64). */
export async function obtenerResumenCasosNav(): Promise<ResumenCasosNav> {
  const sesion = await auth();
  const userId = sesion?.user?.id;
  if (!userId) {
    return { href: "/mis-mascotas", pendientes: 0, perdidas: 0 };
  }

  const lista = await db
    .select({ id: mascotas.id, estado: mascotas.estado })
    .from(mascotas)
    .where(and(eq(mascotas.userId, userId), inArray(mascotas.tipo, [...TIPOS_MASCOTA])))
    .orderBy(desc(mascotas.updatedAt));

  if (lista.length === 0) {
    return { href: "/mis-mascotas", pendientes: 0, perdidas: 0 };
  }

  const perdidas = lista.filter((m) => m.estado === "PERDIDA");
  const ids = lista.map((m) => m.id);

  const pendientesRows = await db
    .select({ total: count() })
    .from(avistamientos)
    .where(
      and(
        inArray(avistamientos.mascotaId, ids),
        eq(avistamientos.estado, "PENDIENTE")
      )
    );

  const pendientes = Number(pendientesRows[0]?.total ?? 0);

  if (perdidas.length === 0) {
    return { href: "/mis-mascotas", pendientes, perdidas: 0 };
  }

  const href =
    perdidas.length === 1
      ? `/mis-mascotas/${perdidas[0]!.id}/caso`
      : "/mis-mascotas#casos-activos";

  return { href, pendientes, perdidas: perdidas.length };
}
