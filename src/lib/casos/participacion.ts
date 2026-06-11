/**
 * Participación en la coordinación de una mascota (servidor / BD).
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mascotas } from "@/lib/db/schema";

export type { PapelParticipacion } from "@/lib/casos/papel";
export { esAutorReporte, papelEnConversacion } from "@/lib/casos/papel";

export async function esDuenoFicha(
  mascotaId: string,
  userId: string | null
): Promise<boolean> {
  if (!userId) return false;
  const [m] = await db
    .select({ userId: mascotas.userId })
    .from(mascotas)
    .where(eq(mascotas.id, mascotaId))
    .limit(1);
  return m?.userId === userId;
}
