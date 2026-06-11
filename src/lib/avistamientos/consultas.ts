/**
 * Consultas compartidas de reportes de avistamiento (servidor).
 */
import { and, asc, desc, eq, inArray, ne, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { avistamientos, mensajesAvistamiento } from "@/lib/db/schema";

export type OpcionesListadoReportes = {
  incluirDescartados?: boolean;
  vistaDueno?: boolean;
};

export function condicionesListadoReportesMascota(
  mascotaId: string,
  opciones?: OpcionesListadoReportes
): SQL[] {
  const condiciones = [eq(avistamientos.mascotaId, mascotaId)];
  if (!opciones?.incluirDescartados && !opciones?.vistaDueno) {
    condiciones.push(ne(avistamientos.estado, "DESCARTADO"));
  }
  return condiciones;
}

export async function listarReportesPorMascota(
  mascotaId: string,
  opciones?: OpcionesListadoReportes
) {
  return db
    .select()
    .from(avistamientos)
    .where(and(...condicionesListadoReportesMascota(mascotaId, opciones)))
    .orderBy(desc(avistamientos.numeroReporte));
}

export async function agruparMensajesPorReporte(avistamientoIds: string[]) {
  const mapa = new Map<string, (typeof mensajesAvistamiento.$inferSelect)[]>();
  if (avistamientoIds.length === 0) return mapa;

  const mensajes = await db
    .select()
    .from(mensajesAvistamiento)
    .where(inArray(mensajesAvistamiento.avistamientoId, avistamientoIds))
    .orderBy(asc(mensajesAvistamiento.createdAt));

  for (const m of mensajes) {
    const arr = mapa.get(m.avistamientoId) ?? [];
    arr.push(m);
    mapa.set(m.avistamientoId, arr);
  }
  return mapa;
}

export async function listarReportesConMensajesPorMascota(
  mascotaId: string,
  opciones?: OpcionesListadoReportes
) {
  const lista = await listarReportesPorMascota(mascotaId, opciones);
  if (lista.length === 0) return [];

  const incluirMensajes = Boolean(opciones?.vistaDueno);
  if (!incluirMensajes) {
    return lista.map((av) => ({ ...av, mensajes: [] }));
  }

  const mensajesPorId = await agruparMensajesPorReporte(lista.map((a) => a.id));
  return lista.map((av) => ({
    ...av,
    mensajes: mensajesPorId.get(av.id) ?? [],
  }));
}
