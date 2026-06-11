/**
 * Acceso a reportes de avistamiento.
 *
 * Cualquier usuario logueado puede CREAR un reporte (mapa o vinculado a mascota).
 * Para VER o CHATEAR:
 *   - Dueño de la mascota → todos los reportes de su ficha.
 *   - Reportante → solo el reporte que él creó (`avistamiento.user_id`).
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { avistamientos, mascotas } from "@/lib/db/schema";

export type ContextoReporte = {
  avistamientoId: string;
  mascotaId: string | null;
  duenoUserId: string | null;
  reportanteUserId: string | null;
  numeroReporte: number;
};

export async function obtenerContextoReporte(
  avistamientoId: string
): Promise<ContextoReporte | null> {
  const [fila] = await db
    .select({
      avistamientoId: avistamientos.id,
      mascotaId: avistamientos.mascotaId,
      reportanteUserId: avistamientos.userId,
      duenoUserId: mascotas.userId,
      numeroReporte: avistamientos.numeroReporte,
    })
    .from(avistamientos)
    .leftJoin(mascotas, eq(avistamientos.mascotaId, mascotas.id))
    .where(eq(avistamientos.id, avistamientoId))
    .limit(1);

  if (!fila) return null;
  return fila;
}

/** Dueño: todos los reportes de su mascota. Reportante: solo el propio. */
export async function puedeAccederReporte(
  avistamientoId: string,
  userId: string
): Promise<boolean> {
  const ctx = await obtenerContextoReporte(avistamientoId);
  if (!ctx) return false;
  if (ctx.duenoUserId === userId) return true;
  if (ctx.reportanteUserId === userId) return true;
  return false;
}

/** Verificar o descartar un reporte: solo el dueño de la mascota vinculada. */
export async function puedeGestionarReporte(
  avistamientoId: string,
  userId: string
): Promise<boolean> {
  const ctx = await obtenerContextoReporte(avistamientoId);
  if (!ctx?.mascotaId || !ctx.duenoUserId) return false;
  return ctx.duenoUserId === userId;
}
