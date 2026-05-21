import type { RolUsuario } from "@/lib/db/schema";

/** Etiquetas visibles. CIUDADANO y DUENO son equivalentes (DUENO queda por compatibilidad en BD). */
export const ETIQUETAS_ROL: Record<RolUsuario, string> = {
  CIUDADANO: "Miembro",
  DUENO: "Miembro",
  ADMINISTRADOR: "Administrador",
};

export function etiquetaRol(rol: RolUsuario) {
  return ETIQUETAS_ROL[rol] ?? "Miembro";
}

export function esAdministrador(rol: RolUsuario) {
  return rol === "ADMINISTRADOR";
}

export function puedeGestionarUsuarios(rol: RolUsuario) {
  return esAdministrador(rol);
}

/** Cualquier usuario autenticado puede registrar mascotas, reportar pérdidas y avistamientos. */
export function puedeUsarCuentaCompleta(_rol: RolUsuario) {
  return true;
}
