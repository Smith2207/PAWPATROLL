/**
 * Autenticación y autorización: roles.
 */
import type { RolUsuario } from "@/lib/db/schema";

export const ETIQUETAS_ROL: Record<RolUsuario, string> = {
  USUARIO: "Usuario",
  ADMINISTRADOR: "Administrador",
};

export function etiquetaRol(rol: RolUsuario) {
  return ETIQUETAS_ROL[rol] ?? "Usuario";
}
