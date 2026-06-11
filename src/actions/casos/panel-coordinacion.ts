"use server";



/**
 * Server Actions (casos › panel-coordinacion): operaciones de servidor invocadas desde la UI.
 */
/**
 * Server Actions (casos › panel-coordinacion): operaciones de servidor invocadas desde la UI.
 */
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  avistamientos,
  eventosCaso,
  mascotaFotos,
  mascotas,
  users,
} from "@/lib/db/schema";
import { puedeAccederCentroCoordinacion } from "@/lib/mascotas/estados";
import { agruparMensajesPorReporte } from "@/lib/avistamientos/consultas";
import { mensajesConAdjuntoApi } from "@/lib/chat/adjunto-mensaje";
import {
  mapNoLeidosPorAvistamiento,
  obtenerUltimaLecturaInterlocutor,
} from "@/lib/chat/lectura-servidor";
import { esDuenoFicha } from "@/lib/casos/participacion";
import {
  esAdministrador,
  obtenerSesion,
} from "@/lib/auth/sesion-servidor";

/** Panel del dueño: todos los reportes y conversaciones de una mascota. */
export async function obtenerPanelCoordinacion(mascotaId: string) {
  const sesion = await obtenerSesion();
  const userId = sesion?.user?.id ?? null;
  if (!userId) return null;

  const esAdmin = esAdministrador(sesion);
  const esDueno = await esDuenoFicha(mascotaId, userId);
  if (!esDueno && !esAdmin) return null;

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

  const avistamientosLista = await db
    .select()
    .from(avistamientos)
    .where(eq(avistamientos.mascotaId, mascotaId))
    .orderBy(desc(avistamientos.numeroReporte));

  if (
    !esAdmin &&
    !puedeAccederCentroCoordinacion(mascota.estado, avistamientosLista.length)
  ) {
    return null;
  }

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

  const ids = avistamientosLista.map((a) => a.id);
  const mensajesPorAv = await agruparMensajesPorReporte(ids);

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

  const duenoNombre = mascotaRow.duenoNombre?.trim() || "Usuario";
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
          eventos: [...eventosMascota, ...(eventosPorAv.get(av.id) ?? [])],
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
