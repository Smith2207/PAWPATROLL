"use server";



/**
 * Server Actions (chat › conversacion): operaciones de servidor invocadas desde la UI.
 */
/**
 * Server Actions (chat › conversacion): operaciones de servidor invocadas desde la UI.
 */
import { asc, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  avistamientos,
  eventosCaso,
  lecturasChat,
  mascotaFotos,
  mascotas,
  mensajesAvistamiento,
  users,
} from "@/lib/db/schema";
import { mensajesConAdjuntoApi } from "@/lib/chat/adjunto-mensaje";
import { mapEventosATimeline, mapEventosParaAvistamiento } from "@/lib/chat/timeline";
import type { EventoCasoTimeline } from "@/lib/chat/timeline";
import {
  mapNoLeidosPorAvistamiento,
  mapUltimoMensajePorAvistamiento,
  obtenerUltimaLecturaInterlocutor,
} from "@/lib/chat/lectura-servidor";
import { esDuenoFicha } from "@/lib/casos/participacion";
import { sesionUsuario } from "@/lib/auth/sesion-servidor";
import {
  puedeAccederChatAvistamiento,
  puedeAccederPanelCoordinacionMascota,
} from "@/actions/chat/acceso";

/** Conversación 1:1 con un reporte de avistamiento. */
export async function obtenerChatPrivadoAvistamiento(avistamientoId: string) {
  const userId = await sesionUsuario();
  if (!userId || !(await puedeAccederChatAvistamiento(avistamientoId))) {
    return null;
  }

  const [av] = await db
    .select({
      av: avistamientos,
      nombreMascota: mascotas.nombre,
      tipoMascota: mascotas.tipo,
      slug: mascotas.slug,
      mascotaId: mascotas.id,
      mascotaEstado: mascotas.estado,
      duenoUserId: mascotas.userId,
      duenoNombre: users.name,
      duenoImagen: users.image,
    })
    .from(avistamientos)
    .leftJoin(mascotas, eq(avistamientos.mascotaId, mascotas.id))
    .leftJoin(users, eq(mascotas.userId, users.id))
    .where(eq(avistamientos.id, avistamientoId))
    .limit(1);

  if (!av) return null;

  const mensajes = await db
    .select()
    .from(mensajesAvistamiento)
    .where(eq(mensajesAvistamiento.avistamientoId, avistamientoId))
    .orderBy(asc(mensajesAvistamiento.createdAt));

  const esDueno = av.mascotaId
    ? await esDuenoFicha(av.mascotaId, userId)
    : false;

  let reportanteNombre = av.av.nombreReportante?.trim() || "Usuario";
  let reportanteImagen: string | null = null;
  if (av.av.userId) {
    const [reportante] = await db
      .select({ name: users.name, image: users.image })
      .from(users)
      .where(eq(users.id, av.av.userId))
      .limit(1);
    if (reportante?.name?.trim()) {
      reportanteNombre = reportante.name.trim();
    }
    reportanteImagen = reportante?.image ?? null;
  }

  const eventosGlobales = av.mascotaId
    ? await db
        .select()
        .from(eventosCaso)
        .where(eq(eventosCaso.mascotaId, av.mascotaId))
        .orderBy(asc(eventosCaso.createdAt))
    : [];

  const eventosFiltrados = eventosGlobales.filter(
    (e) => !e.avistamientoId || e.avistamientoId === avistamientoId
  );

  const ultimoLeidoInterlocutorAt = await obtenerUltimaLecturaInterlocutor(
    avistamientoId,
    userId,
    av.duenoUserId ?? "",
    av.av.userId ?? null
  );

  let fotoPrincipal: string | null = null;
  let totalAvistamientos = 0;
  let ultimoAvistamientoDireccion: string | null = null;

  if (av.mascotaId) {
    const [fotoRow] = await db
      .select({ url: mascotaFotos.url })
      .from(mascotaFotos)
      .where(eq(mascotaFotos.mascotaId, av.mascotaId))
      .orderBy(mascotaFotos.orden)
      .limit(1);
    fotoPrincipal = fotoRow?.url ?? null;

    const [totalRow] = await db
      .select({ n: count() })
      .from(avistamientos)
      .where(eq(avistamientos.mascotaId, av.mascotaId));
    totalAvistamientos = Number(totalRow?.n ?? 0);

    const [ultimoRow] = await db
      .select({ direccion: avistamientos.direccion })
      .from(avistamientos)
      .where(eq(avistamientos.mascotaId, av.mascotaId))
      .orderBy(desc(avistamientos.createdAt))
      .limit(1);
    ultimoAvistamientoDireccion = ultimoRow?.direccion?.trim() || null;
  }

  return {
    avistamiento: av.av,
    nombreMascota: av.nombreMascota,
    tipoMascota: av.tipoMascota,
    slug: av.slug,
    mascota:
      av.mascotaId && av.nombreMascota && av.tipoMascota && av.slug
        ? {
            id: av.mascotaId,
            nombre: av.nombreMascota,
            tipo: av.tipoMascota,
            slug: av.slug,
            estado: av.mascotaEstado ?? "PERDIDA",
            fotoPrincipal,
          }
        : null,
    resumenCabecera: {
      totalAvistamientos,
      ultimoAvistamientoDireccion,
    },
    mensajes: mensajesConAdjuntoApi(mensajes),
    eventos: mapEventosParaAvistamiento(eventosFiltrados, {
      id: av.av.id,
      lat: av.av.lat,
      lng: av.av.lng,
      direccion: av.av.direccion,
      enTiempoReal: av.av.enTiempoReal,
    }),
    esDueno,
    duenoUserId: av.duenoUserId ?? "",
    duenoNombre: av.duenoNombre?.trim() || "Usuario",
    duenoImagen: av.duenoImagen ?? null,
    reportanteUserId: av.av.userId ?? null,
    reportanteNombre,
    reportanteImagen,
    ultimoLeidoInterlocutorAt,
  };
}

export async function listarMensajesChatAvistamiento(avistamientoId: string) {
  const userId = await sesionUsuario();
  if (!userId || !(await puedeAccederChatAvistamiento(avistamientoId))) {
    return null;
  }

  const mensajes = await db
    .select()
    .from(mensajesAvistamiento)
    .where(eq(mensajesAvistamiento.avistamientoId, avistamientoId))
    .orderBy(asc(mensajesAvistamiento.createdAt));

  const [av] = await db
    .select({
      duenoUserId: mascotas.userId,
      reportanteUserId: avistamientos.userId,
      mascotaId: avistamientos.mascotaId,
      avistamientoId: avistamientos.id,
      lat: avistamientos.lat,
      lng: avistamientos.lng,
      direccion: avistamientos.direccion,
      enTiempoReal: avistamientos.enTiempoReal,
    })
    .from(avistamientos)
    .leftJoin(mascotas, eq(avistamientos.mascotaId, mascotas.id))
    .where(eq(avistamientos.id, avistamientoId))
    .limit(1);

  const ultimoLeidoInterlocutorAt = av
    ? await obtenerUltimaLecturaInterlocutor(
        avistamientoId,
        userId,
        av.duenoUserId ?? "",
        av.reportanteUserId ?? null
      )
    : null;

  let eventos: typeof eventosCaso.$inferSelect[] = [];
  if (av?.mascotaId) {
    const eventosGlobales = await db
      .select()
      .from(eventosCaso)
      .where(eq(eventosCaso.mascotaId, av.mascotaId))
      .orderBy(asc(eventosCaso.createdAt));
    eventos = eventosGlobales.filter(
      (e) => !e.avistamientoId || e.avistamientoId === avistamientoId
    );
  }

  const avistamientosPorId = new Map<
    string,
    { lat: string; lng: string; direccion: string | null; enTiempoReal: boolean }
  >();
  if (av?.avistamientoId) {
    avistamientosPorId.set(av.avistamientoId, {
      lat: av.lat,
      lng: av.lng,
      direccion: av.direccion,
      enTiempoReal: av.enTiempoReal,
    });
  }
  const idsExtra = [
    ...new Set(
      eventos
        .map((e) => e.avistamientoId)
        .filter((id): id is string => Boolean(id && id !== av?.avistamientoId))
    ),
  ];
  if (idsExtra.length > 0) {
    const filas = await db
      .select({
        id: avistamientos.id,
        lat: avistamientos.lat,
        lng: avistamientos.lng,
        direccion: avistamientos.direccion,
        enTiempoReal: avistamientos.enTiempoReal,
      })
      .from(avistamientos)
      .where(inArray(avistamientos.id, idsExtra));
    for (const fila of filas) {
      avistamientosPorId.set(fila.id, fila);
    }
  }

  const eventosTimeline: EventoCasoTimeline[] = mapEventosATimeline(
    eventos,
    avistamientosPorId
  );

  return {
    mensajes: mensajesConAdjuntoApi(mensajes),
    ultimoLeidoInterlocutorAt,
    eventos: eventosTimeline,
  };
}

export type ResumenChatAvistamiento = {
  avistamientoId: string;
  noLeidos: number;
  ultimoLeidoInterlocutorAt: Date | null;
  ultimoContenido: string | null;
  ultimoAdjuntoUrl: string | null;
  ultimoActividad: Date | null;
};

/** Resúmenes de conversaciones del panel de coordinación (dueño). */
export async function sincronizarResumenChatsMascota(
  mascotaId: string
): Promise<ResumenChatAvistamiento[] | null> {
  const userId = await sesionUsuario();
  if (!userId || !(await puedeAccederPanelCoordinacionMascota(mascotaId))) {
    return null;
  }

  const [mascotaRow] = await db
    .select({ userId: mascotas.userId })
    .from(mascotas)
    .where(eq(mascotas.id, mascotaId))
    .limit(1);
  if (!mascotaRow) return null;

  const avRows = await db
    .select({
      id: avistamientos.id,
      reportanteUserId: avistamientos.userId,
    })
    .from(avistamientos)
    .where(eq(avistamientos.mascotaId, mascotaId));

  const ids = avRows.map((a) => a.id);
  if (ids.length === 0) return [];

  const noLeidosMap = await mapNoLeidosPorAvistamiento(ids, userId);
  const ultimosMap = await mapUltimoMensajePorAvistamiento(ids);

  return Promise.all(
    avRows.map(async (av) => {
      const ultimo = ultimosMap.get(av.id);
      const ultimoLeidoInterlocutorAt = await obtenerUltimaLecturaInterlocutor(
        av.id,
        userId,
        mascotaRow.userId,
        av.reportanteUserId ?? null
      );
      return {
        avistamientoId: av.id,
        noLeidos: noLeidosMap.get(av.id) ?? 0,
        ultimoLeidoInterlocutorAt,
        ultimoContenido: ultimo?.contenido ?? null,
        ultimoAdjuntoUrl: ultimo?.adjuntoUrl ?? null,
        ultimoActividad: ultimo?.createdAt ?? null,
      };
    })
  );
}

export async function marcarChatLeido(
  avistamientoId: string
): Promise<{ ok: boolean }> {
  const userId = await sesionUsuario();
  if (!userId || !(await puedeAccederChatAvistamiento(avistamientoId))) {
    return { ok: false };
  }

  const leidoAt = new Date();

  await db
    .insert(lecturasChat)
    .values({
      avistamientoId,
      userId,
      ultimoLeidoAt: leidoAt,
    })
    .onConflictDoUpdate({
      target: [lecturasChat.avistamientoId, lecturasChat.userId],
      set: { ultimoLeidoAt: leidoAt },
    });

  const [av] = await db
    .select({
      reportanteUserId: avistamientos.userId,
      duenoUserId: mascotas.userId,
    })
    .from(avistamientos)
    .leftJoin(mascotas, eq(avistamientos.mascotaId, mascotas.id))
    .where(eq(avistamientos.id, avistamientoId))
    .limit(1);

  const destinatarioUserId =
    av?.duenoUserId === userId
      ? av.reportanteUserId
      : av?.duenoUserId;

  const { emitirTiempoReal } = await import("@/lib/tiempo-real/hub");
  emitirTiempoReal({
    tipo: "chat:leido",
    avistamientoId,
    userId,
    leidoAt: leidoAt.toISOString(),
    destinatarioUserId: destinatarioUserId ?? undefined,
  });

  return { ok: true };
}
