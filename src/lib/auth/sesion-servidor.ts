/**
 * Autenticación y autorización: sesion-servidor.
 */
import { esDuenoFicha } from "@/lib/casos/participacion";
import { esRolAdministrador } from "@/lib/auth/rol-cuenta";

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

export { esDuenoFicha };

export function esAdministrador(
  sesion: Awaited<ReturnType<typeof obtenerSesion>>
): boolean {
  return esRolAdministrador(sesion?.user?.rol);
}
