import { and, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  avistamientos,
  lecturasChat,
  mascotas,
  mensajesAvistamiento,
} from "@/lib/db/schema";
import { idInterlocutorChat } from "@/lib/chat/lectura";

const EPOCH = new Date(0);

/** Mensajes de otros no leídos en chats accesibles (dueño o testigo). */
export async function contarMensajesChatNoLeidos(userId: string): Promise<number> {
  const [fila] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(mensajesAvistamiento)
    .innerJoin(
      avistamientos,
      eq(mensajesAvistamiento.avistamientoId, avistamientos.id)
    )
    .leftJoin(mascotas, eq(avistamientos.mascotaId, mascotas.id))
    .leftJoin(
      lecturasChat,
      and(
        eq(lecturasChat.avistamientoId, avistamientos.id),
        eq(lecturasChat.userId, userId)
      )
    )
    .where(
      and(
        or(eq(mascotas.userId, userId), eq(avistamientos.userId, userId)),
        ne(mensajesAvistamiento.userId, userId),
        sql`${mensajesAvistamiento.createdAt} > COALESCE(${lecturasChat.ultimoLeidoAt}, ${EPOCH})`
      )
    );

  return fila?.n ?? 0;
}

export async function mapNoLeidosPorAvistamiento(
  avistamientoIds: string[],
  userId: string
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (avistamientoIds.length === 0) return map;

  const filas = await db
    .select({
      avistamientoId: mensajesAvistamiento.avistamientoId,
      n: sql<number>`count(*)::int`,
    })
    .from(mensajesAvistamiento)
    .leftJoin(
      lecturasChat,
      and(
        eq(lecturasChat.avistamientoId, mensajesAvistamiento.avistamientoId),
        eq(lecturasChat.userId, userId)
      )
    )
    .where(
      and(
        inArray(mensajesAvistamiento.avistamientoId, avistamientoIds),
        ne(mensajesAvistamiento.userId, userId),
        sql`${mensajesAvistamiento.createdAt} > COALESCE(${lecturasChat.ultimoLeidoAt}, ${EPOCH})`
      )
    )
    .groupBy(mensajesAvistamiento.avistamientoId);

  for (const f of filas) {
    map.set(f.avistamientoId, f.n);
  }
  return map;
}

export async function obtenerUltimaLecturaInterlocutor(
  avistamientoId: string,
  miUserId: string,
  duenoUserId: string,
  reportanteUserId: string | null
): Promise<Date | null> {
  const otroUserId = idInterlocutorChat(miUserId, duenoUserId, reportanteUserId);
  if (!otroUserId) return null;

  const [fila] = await db
    .select({ ultimoLeidoAt: lecturasChat.ultimoLeidoAt })
    .from(lecturasChat)
    .where(
      and(
        eq(lecturasChat.avistamientoId, avistamientoId),
        eq(lecturasChat.userId, otroUserId)
      )
    )
    .limit(1);

  return fila?.ultimoLeidoAt ?? null;
}

export async function mapUltimoMensajePorAvistamiento(avistamientoIds: string[]) {
  const map = new Map<
    string,
    { contenido: string; adjuntoUrl: string | null; createdAt: Date }
  >();
  if (avistamientoIds.length === 0) return map;

  const filas = await db
    .select({
      avistamientoId: mensajesAvistamiento.avistamientoId,
      contenido: mensajesAvistamiento.contenido,
      adjuntoUrl: mensajesAvistamiento.adjuntoUrl,
      createdAt: mensajesAvistamiento.createdAt,
    })
    .from(mensajesAvistamiento)
    .where(inArray(mensajesAvistamiento.avistamientoId, avistamientoIds))
    .orderBy(desc(mensajesAvistamiento.createdAt));

  for (const f of filas) {
    if (!map.has(f.avistamientoId)) {
      map.set(f.avistamientoId, {
        contenido: f.contenido,
        adjuntoUrl: f.adjuntoUrl,
        createdAt: f.createdAt,
      });
    }
  }
  return map;
}
