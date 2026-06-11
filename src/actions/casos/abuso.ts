"use server";



/**
 * Server Actions (casos › abuso): operaciones de servidor invocadas desde la UI.
 */
/**
 * Server Actions (casos › abuso): operaciones de servidor invocadas desde la UI.
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  avistamientos,
  mascotas,
  reportesAbuso,
  users,
} from "@/lib/db/schema";
import type { ResultadoAuth } from "@/actions/autenticacion";
import {
  notificarAdministradoresAbuso,
  registrarEventoCaso,
} from "@/lib/casos/servicio-caso";
import { sesionUsuario } from "@/lib/auth/sesion-servidor";
import { puedeAccederChatAvistamiento } from "@/actions/chat/acceso";

export async function reportarComportamientoSospechoso(
  avistamientoId: string,
  motivo: string
): Promise<ResultadoAuth> {
  const userId = await sesionUsuario();
  if (!userId) return { ok: false, error: "Debes iniciar sesión." };

  const texto = motivo.trim();
  if (texto.length < 10) {
    return { ok: false, error: "Describe el problema con al menos 10 caracteres." };
  }

  if (!(await puedeAccederChatAvistamiento(avistamientoId))) {
    return { ok: false, error: "No tienes acceso a esta conversación." };
  }

  const [av] = await db
    .select({
      mascotaId: avistamientos.mascotaId,
      nombre: users.name,
    })
    .from(avistamientos)
    .leftJoin(users, eq(users.id, userId))
    .where(eq(avistamientos.id, avistamientoId))
    .limit(1);

  await db.insert(reportesAbuso).values({
    avistamientoId,
    reportadoPor: userId,
    motivo: texto,
  });

  void notificarAdministradoresAbuso({
    avistamientoId,
    mascotaId: av?.mascotaId ?? null,
    motivo: texto,
    reportadoPorNombre: av?.nombre ?? "Usuario",
  });

  if (av?.mascotaId) {
    await registrarEventoCaso({
      mascotaId: av.mascotaId,
      avistamientoId,
      tipo: "REPORTE_ABUSO",
      titulo: "Reporte de comportamiento enviado a moderación",
      actorUserId: userId,
    });
  }

  return { ok: true, mensaje: "Reporte enviado. Un administrador lo revisará." };
}
