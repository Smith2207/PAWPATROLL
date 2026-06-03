export type RolConversacion = "dueno" | "testigo" | "administrador";

export const ETIQUETA_ROL: Record<RolConversacion, string> = {
  dueno: "Dueño",
  testigo: "Testigo",
  administrador: "Administrador",
};

/** Rol del participante según su userId en la conversación de avistamiento */
export function rolParticipante(
  userId: string | null | undefined,
  duenoUserId: string,
  esAdmin?: boolean
): RolConversacion {
  if (esAdmin) return "administrador";
  if (userId && userId === duenoUserId) return "dueno";
  return "testigo";
}
