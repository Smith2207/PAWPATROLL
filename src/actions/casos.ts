"use server";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  avistamientos,
  eventosCaso,
  lecturasChat,
  mascotaFotos,
  mascotas,
  mensajesAvistamiento,
  reportesAbuso,
  users,
} from "@/lib/db/schema";
import type { ResultadoAuth } from "@/actions/autenticacion";
import {
  notificarAdministradoresAbuso,
  registrarEventoCaso,
} from "@/lib/casos/servicio-caso";
import { previewMensajeChat } from "@/lib/chat/mensaje";
import {
  contarMensajesChatNoLeidos,
  mapNoLeidosPorAvistamiento,
  mapUltimoMensajePorAvistamiento,
  obtenerUltimaLecturaInterlocutor,
} from "@/lib/chat/lectura-servidor";
import { mensajesConAdjuntoApi } from "@/lib/chat/adjunto-mensaje";

async function sesionUsuario() {
  const { auth } = await import("@/auth");
  const sesion = await auth();
  return sesion?.user?.id ?? null;
}

async function esDuenoMascota(mascotaId: string, userId: string) {
  const [m] = await db
    .select({ userId: mascotas.userId })
    .from(mascotas)
    .where(eq(mascotas.id, mascotaId))
    .limit(1);
  return m?.userId === userId;
}

export async function puedeAccederCasoBusqueda(mascotaId: string) {
  const userId = await sesionUsuario();
  if (!userId) return false;
  const { auth } = await import("@/auth");
  const sesion = await auth();
  if (sesion?.user?.rol === "ADMINISTRADOR") return true;
  return esDuenoMascota(mascotaId, userId);
}

export async function puedeAccederChatAvistamiento(avistamientoId: string) {
  const userId = await sesionUsuario();
  if (!userId) return false;

  const [av] = await db
    .select({
      userId: avistamientos.userId,
      mascotaUserId: mascotas.userId,
    })
    .from(avistamientos)
    .leftJoin(mascotas, eq(avistamientos.mascotaId, mascotas.id))
    .where(eq(avistamientos.id, avistamientoId))
    .limit(1);

  if (!av) return false;
  if (av.mascotaUserId === userId) return true;
  if (av.userId === userId) return true;

  const { auth } = await import("@/auth");
  const sesion = await auth();
  return sesion?.user?.rol === "ADMINISTRADOR";
}

export async function obtenerCasoBusqueda(mascotaId: string) {
  const userId = await sesionUsuario();
  if (!userId) return null;

  const { auth } = await import("@/auth");
  const sesion = await auth();
  const esAdmin = sesion?.user?.rol === "ADMINISTRADOR";
  const dueno = await esDuenoMascota(mascotaId, userId);
  if (!dueno && !esAdmin) return null;

  const [mascotaRow] = await db
    .select({
      mascota: mascotas,
      duenoNombre: users.name,
      duenoImagen: users.image,
    })
    .from(mascotas)
    .leftJoin(users, eq(mascotas.userId, users.id))
    .where(eq(mascotas.id, mascotaId))
    .limit(1);

  if (!mascotaRow) return null;
  const mascota = mascotaRow.mascota;
  if (!esAdmin && mascota.estado !== "PERDIDA") return null;

  const [fotoRow] = await db
    .select({ url: mascotaFotos.url })
    .from(mascotaFotos)
    .where(eq(mascotaFotos.mascotaId, mascotaId))
    .orderBy(mascotaFotos.orden)
    .limit(1);

  const mascotaConFoto = {
    ...mascota,
    fotoPrincipal: fotoRow?.url ?? null,
  };

  const avistamientosLista = await db
    .select()
    .from(avistamientos)
    .where(eq(avistamientos.mascotaId, mascotaId))
    .orderBy(desc(avistamientos.numeroReporte));

  const ids = avistamientosLista.map((a) => a.id);
  const mensajes =
    ids.length > 0
      ? await db
          .select()
          .from(mensajesAvistamiento)
          .where(inArray(mensajesAvistamiento.avistamientoId, ids))
          .orderBy(asc(mensajesAvistamiento.createdAt))
      : [];

  const userIds = [
    ...new Set(
      avistamientosLista
        .map((a) => a.userId)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const usuarios =
    userIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name, image: users.image })
          .from(users)
          .where(inArray(users.id, userIds))
      : [];
  const usuariosPorId = new Map(usuarios.map((u) => [u.id, u]));

  const mensajesPorAv = new Map<string, typeof mensajes>();
  for (const m of mensajes) {
    const arr = mensajesPorAv.get(m.avistamientoId) ?? [];
    arr.push(m);
    mensajesPorAv.set(m.avistamientoId, arr);
  }

  const duenoNombre =
    mascotaRow.duenoNombre?.trim() || "Usuario";
  const duenoImagen = mascotaRow.duenoImagen ?? null;

  const eventos = await db
    .select()
    .from(eventosCaso)
    .where(eq(eventosCaso.mascotaId, mascotaId))
    .orderBy(asc(eventosCaso.createdAt));

  const eventosPorAv = new Map<string, typeof eventos>();
  const eventosMascota: typeof eventos = [];
  for (const ev of eventos) {
    if (ev.avistamientoId) {
      const arr = eventosPorAv.get(ev.avistamientoId) ?? [];
      arr.push(ev);
      eventosPorAv.set(ev.avistamientoId, arr);
    } else {
      eventosMascota.push(ev);
    }
  }

  const coincidenciasIa = eventos.filter((e) => e.tipo === "COINCIDENCIA_IA").length;
  const ultimoAvistamiento = avistamientosLista[0] ?? null;

  const avIds = avistamientosLista.map((a) => a.id);
  const noLeidosMap = await mapNoLeidosPorAvistamiento(avIds, userId);

  return {
    mascota: mascotaConFoto,
    duenoUserId: mascota.userId,
    duenoNombre,
    duenoImagen,
    esAdmin,
    resumen: {
      totalAvistamientos: avistamientosLista.length,
      pendientes: avistamientosLista.filter((a) => a.estado === "PENDIENTE").length,
      coincidenciasIa,
      ultimoAvistamientoDireccion: ultimoAvistamiento?.direccion?.trim() || null,
      ultimoAvistamientoLat: ultimoAvistamiento?.lat ?? null,
      ultimoAvistamientoLng: ultimoAvistamiento?.lng ?? null,
    },
    eventosMascota,
    avistamientos: await Promise.all(
      avistamientosLista.map(async (av) => {
      const reportante = av.userId ? usuariosPorId.get(av.userId) : null;
      const ultimoLeidoInterlocutorAt = await obtenerUltimaLecturaInterlocutor(
        av.id,
        userId,
        mascota.userId,
        av.userId ?? null
      );
      return {
        ...av,
        mensajes: mensajesConAdjuntoApi(mensajesPorAv.get(av.id) ?? []),
        eventos: [
          ...eventosMascota,
          ...(eventosPorAv.get(av.id) ?? []),
        ],
        duenoUserId: mascota.userId,
        duenoNombre,
        duenoImagen,
        reportanteUserId: av.userId ?? null,
        reportanteNombre:
          reportante?.name?.trim() ||
          av.nombreReportante?.trim() ||
          "Usuario",
        reportanteImagen: reportante?.image ?? null,
        noLeidos: noLeidosMap.get(av.id) ?? 0,
        ultimoLeidoInterlocutorAt,
      };
    })
    ),
  };
}

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
    ? await esDuenoMascota(av.mascotaId, userId)
    : false;

  let reportanteNombre =
    av.av.nombreReportante?.trim() || "Usuario";
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

  const eventosGlobales =
    av.mascotaId
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

  return {
    avistamiento: av.av,
    nombreMascota: av.nombreMascota,
    tipoMascota: av.tipoMascota,
    slug: av.slug,
    mensajes: mensajesConAdjuntoApi(mensajes),
    eventos: eventosFiltrados,
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

  return {
    mensajes: mensajesConAdjuntoApi(mensajes),
    ultimoLeidoInterlocutorAt,
    eventos,
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

/** Actualiza badges y previews de la lista lateral del caso (cliente). */
export async function sincronizarResumenChatsMascota(
  mascotaId: string
): Promise<ResumenChatAvistamiento[] | null> {
  const userId = await sesionUsuario();
  if (!userId || !(await puedeAccederCasoBusqueda(mascotaId))) return null;

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

  const { emitirTiempoReal } = await import("@/lib/tiempo-real/hub");
  emitirTiempoReal({
    tipo: "chat:leido",
    avistamientoId,
    userId,
    leidoAt: leidoAt.toISOString(),
  });

  return { ok: true };
}

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
      tipo: "MENSAJE_ENVIADO",
      titulo: "Reporte de comportamiento enviado a moderación",
      actorUserId: userId,
    });
  }

  return { ok: true, mensaje: "Reporte enviado. Un administrador lo revisará." };
}

export async function listarMisCasosComoTestigo() {
  const userId = await sesionUsuario();
  if (!userId) return [];

  const filas = await db
    .select({
      avistamientoId: avistamientos.id,
      numeroReporte: avistamientos.numeroReporte,
      estado: avistamientos.estado,
      createdAt: avistamientos.createdAt,
      nombreMascota: mascotas.nombre,
      tipoMascota: mascotas.tipo,
      slug: mascotas.slug,
      mascotaId: mascotas.id,
      duenoUserId: mascotas.userId,
    })
    .from(avistamientos)
    .innerJoin(mascotas, eq(avistamientos.mascotaId, mascotas.id))
    .where(eq(avistamientos.userId, userId))
    .orderBy(desc(avistamientos.createdAt))
    .limit(30);

  const avIds = filas.map((f) => f.avistamientoId);
  const noLeidosMap = await mapNoLeidosPorAvistamiento(avIds, userId);
  const ultimosMap = await mapUltimoMensajePorAvistamiento(avIds);

  return filas.map((f) => {
    const ultimo = ultimosMap.get(f.avistamientoId);
    return {
      ...f,
      noLeidos: noLeidosMap.get(f.avistamientoId) ?? 0,
      ultimoPreview: ultimo
        ? previewMensajeChat(ultimo)
        : null,
      ultimoActividad: ultimo?.createdAt ?? f.createdAt,
      enlace: `/avistamiento/${f.avistamientoId}`,
    };
  });
}

/** Mensajes de otros participantes no leídos en chats accesibles. */
export async function contarChatsNoLeidos(): Promise<number> {
  const userId = await sesionUsuario();
  if (!userId) return 0;
  return contarMensajesChatNoLeidos(userId);
}

export type CasoChatHub = {
  mascotaId: string;
  nombreMascota: string;
  tipo: string;
  fotoPrincipal: string | null;
  totalAvistamientos: number;
  noLeidos: number;
  ultimoPreview: string | null;
  ultimoActividad: Date | null;
  enlace: string;
};

export type ChatTestigoHub = {
  avistamientoId: string;
  numeroReporte: number;
  nombreMascota: string;
  tipoMascota: string;
  estado: string;
  noLeidos: number;
  ultimoPreview: string | null;
  ultimoActividad: Date;
  enlace: string;
};

export async function listarHubChats(): Promise<{
  casosDueno: CasoChatHub[];
  casosTestigo: ChatTestigoHub[];
}> {
  const userId = await sesionUsuario();
  if (!userId) return { casosDueno: [], casosTestigo: [] };

  const casosTestigo = await listarMisCasosComoTestigo();

  const mascotasPerdidas = await db
    .select({
      id: mascotas.id,
      nombre: mascotas.nombre,
      tipo: mascotas.tipo,
    })
    .from(mascotas)
    .where(and(eq(mascotas.userId, userId), eq(mascotas.estado, "PERDIDA")))
    .orderBy(desc(mascotas.updatedAt));

  const casosDueno: CasoChatHub[] = [];
  for (const m of mascotasPerdidas) {
    const [foto] = await db
      .select({ url: mascotaFotos.url })
      .from(mascotaFotos)
      .where(eq(mascotaFotos.mascotaId, m.id))
      .orderBy(mascotaFotos.orden)
      .limit(1);

    const avs = await db
      .select({ id: avistamientos.id })
      .from(avistamientos)
      .where(eq(avistamientos.mascotaId, m.id));

    const avIds = avs.map((a) => a.id);
    const noLeidosMap = await mapNoLeidosPorAvistamiento(avIds, userId);
    const ultimosMap = await mapUltimoMensajePorAvistamiento(avIds);

    let noLeidos = 0;
    let ultimoPreview: string | null = null;
    let ultimoActividad: Date | null = null;

    for (const id of avIds) {
      noLeidos += noLeidosMap.get(id) ?? 0;
      const ultimo = ultimosMap.get(id);
      if (ultimo && (!ultimoActividad || ultimo.createdAt > ultimoActividad)) {
        ultimoActividad = ultimo.createdAt;
        ultimoPreview = previewMensajeChat(ultimo);
      }
    }

    casosDueno.push({
      mascotaId: m.id,
      nombreMascota: m.nombre,
      tipo: m.tipo,
      fotoPrincipal: foto?.url ?? null,
      totalAvistamientos: avIds.length,
      noLeidos,
      ultimoPreview,
      ultimoActividad,
      enlace: `/mis-mascotas/${m.id}/caso`,
    });
  }

  return {
    casosDueno,
    casosTestigo: casosTestigo.map((c) => ({
      avistamientoId: c.avistamientoId,
      numeroReporte: c.numeroReporte,
      nombreMascota: c.nombreMascota,
      tipoMascota: c.tipoMascota,
      estado: c.estado,
      noLeidos: c.noLeidos,
      ultimoPreview: c.ultimoPreview,
      ultimoActividad: c.ultimoActividad,
      enlace: c.enlace,
    })),
  };
}
