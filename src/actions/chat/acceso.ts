"use server";



/**
 * Server Actions (chat › acceso): operaciones de servidor invocadas desde la UI.
 */
/**
 * Server Actions (chat › acceso): operaciones de servidor invocadas desde la UI.
 */
import { puedeAccederConversacion } from "@/lib/chat/acceso";
import { puedeAccederPanelCoordinacion } from "@/lib/casos/acceso";
import {
  esAdministrador,
  obtenerSesion,
} from "@/lib/auth/sesion-servidor";

/** Conversación de un reporte: dueño (todos los hilos) o autor del reporte. */
export async function puedeAccederChatAvistamiento(avistamientoId: string) {
  const sesion = await obtenerSesion();
  const userId = sesion?.user?.id ?? null;
  if (!userId) return false;
  if (esAdministrador(sesion)) return true;
  return puedeAccederConversacion(avistamientoId, userId);
}

/** Panel de coordinación de avistamientos de una mascota. */
export async function puedeAccederPanelCoordinacionMascota(mascotaId: string) {
  const sesion = await obtenerSesion();
  const userId = sesion?.user?.id ?? null;
  if (!userId) return false;
  if (esAdministrador(sesion)) return true;
  return puedeAccederPanelCoordinacion(mascotaId, userId);
}
