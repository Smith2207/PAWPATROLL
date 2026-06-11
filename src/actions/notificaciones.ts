"use server";



/**
 * Server Actions (notificaciones): operaciones de servidor invocadas desde la UI.
 */
/**
 * Server Actions (notificaciones): operaciones de servidor invocadas desde la UI.
 */
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { notificaciones, type NotificacionTipo } from "@/lib/db/schema";
import { sesionUsuario } from "@/lib/auth/sesion-servidor";

export type NotificacionAgrupada = {
  id: string;
  tipo: NotificacionTipo;
  prioridad: string;
  titulo: string;
  cuerpo: string | null;
  enlace: string | null;
  mascotaId: string | null;
  avistamientoId: string | null;
  leida: boolean;
  createdAt: Date;
  cantidadGrupo: number;
};

export async function contarNotificacionesNoLeidas(): Promise<number> {
  const userId = await sesionUsuario();
  if (!userId) return 0;

  const [fila] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notificaciones)
    .where(
      and(eq(notificaciones.userId, userId), isNull(notificaciones.leidaAt))
    );

  return fila?.n ?? 0;
}

export async function listarNotificacionesUsuario(
  limite = 40
): Promise<NotificacionAgrupada[]> {
  const userId = await sesionUsuario();
  if (!userId) return [];

  const filas = await db
    .select()
    .from(notificaciones)
    .where(eq(notificaciones.userId, userId))
    .orderBy(desc(notificaciones.createdAt))
    .limit(limite);

  const vistos = new Set<string>();
  const resultado: NotificacionAgrupada[] = [];

  for (const n of filas) {
    const clave = n.grupoClave ?? n.id;
    if (vistos.has(clave)) continue;
    vistos.add(clave);

    const delGrupo = filas.filter(
      (f) => (f.grupoClave ?? f.id) === clave
    );

    resultado.push({
      id: n.id,
      tipo: n.tipo,
      prioridad: n.prioridad,
      titulo:
        delGrupo.length > 1
          ? `${n.titulo} (${delGrupo.length})`
          : n.titulo,
      cuerpo: n.cuerpo,
      enlace: n.enlace,
      mascotaId: n.mascotaId,
      avistamientoId: n.avistamientoId,
      leida: delGrupo.every((g) => g.leidaAt != null),
      createdAt: n.createdAt,
      cantidadGrupo: delGrupo.length,
    });
  }

  return resultado;
}

export async function marcarNotificacionLeida(
  id: string
): Promise<{ ok: boolean }> {
  const userId = await sesionUsuario();
  if (!userId) return { ok: false };

  const [n] = await db
    .select({ grupoClave: notificaciones.grupoClave })
    .from(notificaciones)
    .where(and(eq(notificaciones.id, id), eq(notificaciones.userId, userId)))
    .limit(1);

  if (!n) return { ok: false };

  if (n.grupoClave) {
    await db
      .update(notificaciones)
      .set({ leidaAt: new Date() })
      .where(
        and(
          eq(notificaciones.userId, userId),
          eq(notificaciones.grupoClave, n.grupoClave),
          isNull(notificaciones.leidaAt)
        )
      );
  } else {
    await db
      .update(notificaciones)
      .set({ leidaAt: new Date() })
      .where(eq(notificaciones.id, id));
  }

  return { ok: true };
}

export async function marcarTodasNotificacionesLeidas(): Promise<{ ok: boolean }> {
  const userId = await sesionUsuario();
  if (!userId) return { ok: false };

  await db
    .update(notificaciones)
    .set({ leidaAt: new Date() })
    .where(
      and(eq(notificaciones.userId, userId), isNull(notificaciones.leidaAt))
    );

  return { ok: true };
}
