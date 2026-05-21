import type { RolUsuario } from "@/lib/db/schema";

/** Único administrador y correo de soporte del sistema */
export const CORREO_ADMIN_SOPORTE = "paw.patrol.soporte@gmail.com";

export function normalizarCorreo(email: string) {
  return email.trim().toLowerCase();
}

export function esCorreoAdmin(email: string) {
  return normalizarCorreo(email) === CORREO_ADMIN_SOPORTE;
}

/** Solo el correo de soporte es administrador; el resto son miembros de la comunidad. */
export function rolParaNuevoUsuario(email: string): RolUsuario {
  if (esCorreoAdmin(email)) return "ADMINISTRADOR";
  return "CIUDADANO";
}
