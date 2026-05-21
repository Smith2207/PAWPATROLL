import type { RolUsuario } from "@/lib/db/schema";

export const ETIQUETAS_ROL: Record<RolUsuario, string> = {
  CIUDADANO: "Ciudadano",
  DUENO: "Dueño",
  ADMINISTRADOR: "Administrador",
};

export function puedeGestionarUsuarios(rol: RolUsuario) {
  return rol === "ADMINISTRADOR";
}

export function puedeRegistrarMascotas(rol: RolUsuario) {
  return rol === "DUENO" || rol === "ADMINISTRADOR";
}
