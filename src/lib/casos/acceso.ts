/**
 * Coordinación de casos (dueño/testigo): acceso.
 */
import { esDuenoFicha } from "@/lib/casos/participacion";

/** Panel de coordinación (`/mis-mascotas/[id]/caso`): solo el dueño de la ficha. */
export async function puedeAccederPanelCoordinacion(
  mascotaId: string,
  userId: string
): Promise<boolean> {
  return esDuenoFicha(mascotaId, userId);
}
