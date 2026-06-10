"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { avistamientos, mascotaFotos, mascotas } from "@/lib/db/schema";
import { previewMensajeChat } from "@/lib/chat/mensaje";
import {
  contarMensajesChatNoLeidos,
  mapNoLeidosPorAvistamiento,
  mapUltimoMensajePorAvistamiento,
} from "@/lib/chat/lectura-servidor";
import { sesionUsuario } from "@/lib/auth/sesion-servidor";

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
      ultimoPreview: ultimo ? previewMensajeChat(ultimo) : null,
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
