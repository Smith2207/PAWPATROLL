/** ID del otro participante en un chat 1:1 de avistamiento. */
export function idInterlocutorChat(
  miUserId: string,
  duenoUserId: string,
  reportanteUserId: string | null
): string | null {
  if (miUserId === duenoUserId) return reportanteUserId;
  if (reportanteUserId && miUserId === reportanteUserId) return duenoUserId;
  return null;
}

/** El interlocutor abrió el chat después de enviarse este mensaje. */
export function mensajeLeidoPorInterlocutor(
  createdAt: Date,
  ultimoLeidoInterlocutor: Date | null | undefined
): boolean {
  if (!ultimoLeidoInterlocutor) return false;
  return (
    new Date(ultimoLeidoInterlocutor).getTime() >= new Date(createdAt).getTime()
  );
}
