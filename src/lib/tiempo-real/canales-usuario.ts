import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { avistamientos, mascotas } from "@/lib/db/schema";
import type { CanalTiempoReal } from "@/lib/tiempo-real/tipos";

/** Canales WS que el usuario autenticado puede escuchar. */
export async function canalesTiempoRealUsuario(
  userId: string
): Promise<CanalTiempoReal[]> {
  const canales: CanalTiempoReal[] = ["mapa", `usuario:${userId}`];

  const misMascotas = await db
    .select({ id: mascotas.id })
    .from(mascotas)
    .where(eq(mascotas.userId, userId));

  const idsMascotas = misMascotas.map((m) => m.id);
  if (idsMascotas.length > 0) {
    for (const id of idsMascotas) {
      canales.push(`mascota:${id}`);
    }

    const avsMascota = await db
      .select({ id: avistamientos.id })
      .from(avistamientos)
      .where(inArray(avistamientos.mascotaId, idsMascotas));

    for (const av of avsMascota) {
      canales.push(`avistamiento:${av.id}`);
    }
  }

  const avsReportados = await db
    .select({ id: avistamientos.id, mascotaId: avistamientos.mascotaId })
    .from(avistamientos)
    .where(eq(avistamientos.userId, userId));

  for (const av of avsReportados) {
    canales.push(`avistamiento:${av.id}`);
    if (av.mascotaId) canales.push(`mascota:${av.mascotaId}`);
  }

  return [...new Set(canales)];
}
