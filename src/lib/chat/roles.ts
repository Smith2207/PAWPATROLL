/**
 * Etiquetas de participación en una conversación de reporte (no rol de cuenta).
 * Cada conversación está ligada 1:1 a un avistamiento.
 */
import {
  papelEnConversacion,
  type PapelParticipacion,
} from "@/lib/casos/papel";

export type RolConversacion = PapelParticipacion | "administrador";

export const ETIQUETA_ROL: Record<RolConversacion, string> = {
  dueno: "Dueño",
  testigo: "Testigo",
  administrador: "Administrador",
};

export function rolParticipante(
  userId: string | null | undefined,
  duenoUserId: string,
  reportanteUserId?: string | null,
  esAdmin?: boolean
): RolConversacion {
  return (
    papelEnConversacion(userId, duenoUserId, reportanteUserId, esAdmin) ??
    "testigo"
  );
}
