import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mascotas } from "@/lib/db/schema";

/** ID del usuario autenticado o null si no hay sesión. */
export async function sesionUsuario(): Promise<string | null> {
  const { auth } = await import("@/auth");
  const sesion = await auth();
  return sesion?.user?.id ?? null;
}

/** Sesión NextAuth completa (evita llamar auth() varias veces en la misma action). */
export async function obtenerSesion() {
  const { auth } = await import("@/auth");
  return auth();
}

export async function esDuenoMascota(
  mascotaId: string,
  userId: string | null
): Promise<boolean> {
  if (!userId) return false;
  const [m] = await db
    .select({ userId: mascotas.userId })
    .from(mascotas)
    .where(eq(mascotas.id, mascotaId))
    .limit(1);
  return m?.userId === userId;
}

export function esAdministrador(
  sesion: Awaited<ReturnType<typeof obtenerSesion>>
): boolean {
  return sesion?.user?.rol === "ADMINISTRADOR";
}
