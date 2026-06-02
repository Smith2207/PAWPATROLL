"use server";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  avistamientos,
  lecturasChat,
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

  const [mascota] = await db
    .select()
    .from(mascotas)
    .where(eq(mascotas.id, mascotaId))
    .limit(1);

  if (!mascota) return null;
  if (!esAdmin && mascota.estado !== "PERDIDA") return null;

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

  return {
    mascota,
    avistamientos: avistamientosLista.map((av) => {
      const reportante = av.userId ? usuariosPorId.get(av.userId) : null;
      return {
        ...av,
        mensajes: mensajesPorAv.get(av.id) ?? [],
        reportanteNombre:
          reportante?.name?.trim() ||
          av.nombreReportante?.trim() ||
          "Participante",
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
      slug: mascotas.slug,
      mascotaId: mascotas.id,
    })
    .from(avistamientos)
    .leftJoin(mascotas, eq(avistamientos.mascotaId, mascotas.id))
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
    av.av.nombreReportante?.trim() || "Participante";
  if (av.av.userId) {
    const [reportante] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, av.av.userId))
      .limit(1);
    if (reportante?.name?.trim()) {
      reportanteNombre = reportante.name.trim();
    }
  }

  return {
    avistamiento: av.av,
    nombreMascota: av.nombreMascota,
    slug: av.slug,
    mensajes,
    esDueno,
    reportanteNombre,
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
