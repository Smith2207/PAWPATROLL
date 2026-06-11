/**
 * Papel en un hilo de chat (lógica pura, sin BD — usable en cliente).
 */
export type PapelParticipacion = "dueno" | "testigo";

export function esAutorReporte(
  reportanteUserId: string | null | undefined,
  userId: string | null
): boolean {
  return Boolean(reportanteUserId && userId && reportanteUserId === userId);
}

export function papelEnConversacion(
  userId: string | null | undefined,
  duenoUserId: string,
  reportanteUserId: string | null | undefined,
  esAdmin?: boolean
): PapelParticipacion | "administrador" | null {
  if (esAdmin) return "administrador";
  if (userId && userId === duenoUserId) return "dueno";
  if (esAutorReporte(reportanteUserId, userId ?? null)) return "testigo";
  return null;
}
