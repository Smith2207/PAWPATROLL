/**
 * Autenticación y autorización: rol-cuenta.
 */
import type { RolUsuario } from "@/lib/db/schema";
import { esCorreoAdmin } from "@/lib/auth/admin";

/**
 * Rol de cuenta en BD: solo USUARIO o ADMINISTRADOR.
 * Normaliza valores legacy (CIUDADANO, DUENO) y el correo de soporte.
 */
export function normalizarRolCuenta(
  rol: string | null | undefined,
  email?: string | null
): RolUsuario {
  if (email && esCorreoAdmin(email)) return "ADMINISTRADOR";
  if (rol === "ADMINISTRADOR") return "ADMINISTRADOR";
  return "USUARIO";
}

export function esRolAdministrador(
  rol: RolUsuario | string | null | undefined
): boolean {
  return rol === "ADMINISTRADOR";
}
