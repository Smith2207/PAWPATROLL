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
    avistamientos: avistamientosLista.map((av) => {
      const reportante = av.userId ? usuariosPorId.get(av.userId) : null;
      return {
        ...av,
        mensajes: mensajesPorAv.get(av.id) ?? [],
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
      };
    }),
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

  return {
    avistamiento: av.av,
    nombreMascota: av.nombreMascota,
    tipoMascota: av.tipoMascota,
    slug: av.slug,
    mensajes,
    eventos: eventosFiltrados,
    esDueno,
    duenoUserId: av.duenoUserId ?? "",
    duenoNombre: av.duenoNombre?.trim() || "Usuario",
    duenoImagen: av.duenoImagen ?? null,
    reportanteUserId: av.av.userId ?? null,
    reportanteNombre,
    reportanteImagen,
  };
}

export async function marcarChatLeido(
  avistamientoId: string
): Promise<{ ok: boolean }> {
  const userId = await sesionUsuario();
  if (!userId || !(await puedeAccederChatAvistamiento(avistamientoId))) {
    return { ok: false };
  }

  await db
    .insert(lecturasChat)
    .values({
      avistamientoId,
      userId,
      ultimoLeidoAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [lecturasChat.avistamientoId, lecturasChat.userId],
      set: { ultimoLeidoAt: new Date() },
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
    return { ok: false, error: "No tienes acceso a este chat." };
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
      slug: mascotas.slug,
      mascotaId: mascotas.id,
    })
    .from(avistamientos)
    .innerJoin(mascotas, eq(avistamientos.mascotaId, mascotas.id))
    .where(eq(avistamientos.userId, userId))
    .orderBy(desc(avistamientos.createdAt))
    .limit(20);

  return filas;
}
