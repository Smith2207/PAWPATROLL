/**
 * Consultas de avistamientos: borrador-cliente.
 */
import type { DatosAvistamiento } from "@/actions/avistamientos";
import { crearApiBorrador } from "@/lib/borrador/crear-borrador-cliente";
import {
  SESSION_BORRADOR_AVISTAMIENTO,
  SESSION_EXITO_AVISTAMIENTO,
  SESSION_PENDIENTE_AUTH_AVISTAMIENTO,
} from "@/lib/claves-session-cliente";

const api = crearApiBorrador<BorradorAvistamiento, ExitoAvistamientoPendiente>({
  borrador: SESSION_BORRADOR_AVISTAMIENTO,
  exito: SESSION_EXITO_AVISTAMIENTO,
  pendienteAuth: SESSION_PENDIENTE_AUTH_AVISTAMIENTO,
});

export type BorradorAvistamiento = {
  datos: DatosAvistamiento;
  guardadoEn: string;
};

export type ExitoAvistamientoPendiente = {
  mensaje: string;
  numeroReporte?: number;
};

export const marcarAvistamientoPendienteAuth = api.marcarPendienteAuth;
export const hayAvistamientoPendienteAuth = api.hayPendienteAuth;
export const limpiarAvistamientoPendienteAuth = api.limpiarPendienteAuth;

export function guardarBorradorAvistamiento(datos: DatosAvistamiento): boolean {
  return api.guardarBorrador({
    datos,
    guardadoEn: new Date().toISOString(),
  });
}

export const leerBorradorAvistamiento = api.leerBorrador;
export const limpiarBorradorAvistamiento = api.limpiarBorrador;
export const guardarExitoAvistamiento = api.guardarExito;
export const leerYQuitarExitoAvistamiento = api.leerYQuitarExito;
