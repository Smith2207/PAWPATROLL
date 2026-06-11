"use server";



/**
 * Server Actions (chat › hub): operaciones de servidor invocadas desde la UI.
 */
/**
 * Server Actions (chat › hub): operaciones de servidor invocadas desde la UI.
 */
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { avistamientos, mascotaFotos, mascotas } from "@/lib/db/schema";
import { previewMensajeChat } from "@/lib/chat/mensaje";
import {
  contarMensajesChatNoLeidos,
  mapNoLeidosPorAvistamiento,
  mapUltimoMensajePorAvistamiento,
} from "@/lib/chat/lectura-servidor";
import type { PapelParticipacion } from "@/lib/casos/papel";
import { sesionUsuario } from "@/lib/auth/sesion-servidor";

/** Una fila = una conversación ligada a un reporte de avistamiento. */
export type ConversacionHub = {
  avistamientoId: string;
  numeroReporte: number;
  mascotaId: string;
  nombreMascota: string;
  tipo: string;
  fotoPrincipal: string | null;
  papel: PapelParticipacion;
  noLeidos: number;
  ultimoPreview: string | null;
  ultimoActividad: Date | null;
  enlace: string;
};

export async function contarChatsNoLeidos(): Promise<number> {
  const userId = await sesionUsuario();
  if (!userId) return 0;
  return contarMensajesChatNoLeidos(userId);
}

export async function listarConversaciones(): Promise<ConversacionHub[]> {
  const userId = await sesionUsuario();
  if (!userId) return [];

  const filasAutor = await db
    .select({
      avistamientoId: avistamientos.id,
      numeroReporte: avistamientos.numeroReporte,
      createdAt: avistamientos.createdAt,
      mascotaId: mascotas.id,
      nombreMascota: mascotas.nombre,
      tipo: mascotas.tipo,
      duenoUserId: mascotas.userId,
    })
    .from(avistamientos)
    .innerJoin(mascotas, eq(avistamientos.mascotaId, mascotas.id))
    .where(eq(avistamientos.userId, userId))
    .orderBy(desc(avistamientos.createdAt))
    .limit(50);

  const filasDueno = await db
    .select({
      avistamientoId: avistamientos.id,
      numeroReporte: avistamientos.numeroReporte,
      createdAt: avistamientos.createdAt,
      mascotaId: mascotas.id,
      nombreMascota: mascotas.nombre,
      tipo: mascotas.tipo,
      duenoUserId: mascotas.userId,
    })
    .from(avistamientos)
    .innerJoin(mascotas, eq(avistamientos.mascotaId, mascotas.id))
    .where(eq(mascotas.userId, userId))
    .orderBy(desc(avistamientos.createdAt))
    .limit(50);

  const porId = new Map<
    string,
    (typeof filasAutor)[number] & { papel: PapelParticipacion }
  >();

  for (const f of filasDueno) {
    porId.set(f.avistamientoId, { ...f, papel: "dueno" });
  }
  for (const f of filasAutor) {
    if (f.duenoUserId === userId) {
      if (!porId.has(f.avistamientoId)) {
        porId.set(f.avistamientoId, { ...f, papel: "dueno" });
      }
    } else if (!porId.has(f.avistamientoId)) {
      porId.set(f.avistamientoId, { ...f, papel: "testigo" });
    }
  }

  const filas = [...porId.values()];
  if (filas.length === 0) return [];

  const avIds = filas.map((f) => f.avistamientoId);
  const mascotaIds = [...new Set(filas.map((f) => f.mascotaId))];

  const noLeidosMap = await mapNoLeidosPorAvistamiento(avIds, userId);
  const ultimosMap = await mapUltimoMensajePorAvistamiento(avIds);

  const fotos = await db
    .select({
      mascotaId: mascotaFotos.mascotaId,
      url: mascotaFotos.url,
    })
    .from(mascotaFotos)
    .where(inArray(mascotaFotos.mascotaId, mascotaIds))
    .orderBy(mascotaFotos.orden);

  const fotoPorMascota = new Map<string, string>();
  for (const f of fotos) {
    if (!fotoPorMascota.has(f.mascotaId)) {
      fotoPorMascota.set(f.mascotaId, f.url);
    }
  }

  const conversaciones: ConversacionHub[] = filas.map((f) => {
    const ultimo = ultimosMap.get(f.avistamientoId);
    return {
      avistamientoId: f.avistamientoId,
      numeroReporte: f.numeroReporte,
      mascotaId: f.mascotaId,
      nombreMascota: f.nombreMascota,
      tipo: f.tipo,
      fotoPrincipal: fotoPorMascota.get(f.mascotaId) ?? null,
      papel: f.papel,
      noLeidos: noLeidosMap.get(f.avistamientoId) ?? 0,
      ultimoPreview: ultimo ? previewMensajeChat(ultimo) : null,
      ultimoActividad: ultimo?.createdAt ?? f.createdAt,
      enlace: `/avistamiento/${f.avistamientoId}`,
    };
  });

  return conversaciones.sort((a, b) => {
    const ta = a.ultimoActividad?.getTime() ?? 0;
    const tb = b.ultimoActividad?.getTime() ?? 0;
    return tb - ta;
  });
}
