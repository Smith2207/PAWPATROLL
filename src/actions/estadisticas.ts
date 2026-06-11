"use server";



/**
 * Server Actions (estadisticas): operaciones de servidor invocadas desde la UI.
 */
/**
 * Server Actions (estadisticas): operaciones de servidor invocadas desde la UI.
 */
import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { avistamientos, mascotas, users } from "@/lib/db/schema";
import { TIPOS_MASCOTA } from "@/lib/mascotas/tipos";

export type EstadisticasLanding = {
  usuarios: number;
  perdidasActivas: number;
  reunidas: number;
  avistamientos: number;
};

const VACIO: EstadisticasLanding = {
  usuarios: 0,
  perdidasActivas: 0,
  reunidas: 0,
  avistamientos: 0,
};

export async function obtenerEstadisticasLanding(): Promise<EstadisticasLanding> {
  try {
    const soloMascotas = inArray(mascotas.tipo, [...TIPOS_MASCOTA]);

    const [[u], [perdidas], [reunidas], [av]] = await Promise.all([
      db.select({ n: count() }).from(users),
      db
        .select({ n: count() })
        .from(mascotas)
        .where(
          and(
            inArray(mascotas.estado, ["PERDIDA", "ENCONTRADA"]),
            soloMascotas
          )
        ),
      db
        .select({ n: count() })
        .from(mascotas)
        .where(and(eq(mascotas.estado, "REUNIDA"), soloMascotas)),
      db.select({ n: count() }).from(avistamientos),
    ]);

    return {
      usuarios: u?.n ?? 0,
      perdidasActivas: perdidas?.n ?? 0,
      reunidas: reunidas?.n ?? 0,
      avistamientos: av?.n ?? 0,
    };
  } catch {
    return VACIO;
  }
}
