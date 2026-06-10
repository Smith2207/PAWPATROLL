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
