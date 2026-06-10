"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { avistamientos, mascotas } from "@/lib/db/schema";
import {
  esAdministrador,
  esDuenoMascota,
  obtenerSesion,
} from "@/lib/auth/sesion-servidor";

export async function puedeAccederCasoBusqueda(mascotaId: string) {
  const sesion = await obtenerSesion();
  const userId = sesion?.user?.id ?? null;
  if (!userId) return false;
  if (esAdministrador(sesion)) return true;
  return esDuenoMascota(mascotaId, userId);
}

export async function puedeAccederChatAvistamiento(avistamientoId: string) {
  const sesion = await obtenerSesion();
  const userId = sesion?.user?.id ?? null;
  if (!userId) return false;

  const [av] = await db
    .select({
      userId: avistamientos.userId,
      mascotaUserId: mascotas.userId,
    })
    .from(avistamientos)
    .leftJoin(mascotas, eq(avistamientos.mascotaId, mascotas.id))
    .where(eq(avistamientos.id, avistamientoId))
    .limit(1);

  if (!av) return false;
  if (av.mascotaUserId === userId) return true;
  if (av.userId === userId) return true;

  return esAdministrador(sesion);
}
