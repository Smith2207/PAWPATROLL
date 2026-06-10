import type { DatosAvistamiento } from "@/actions/avistamientos";
import {
  guardarExitoSession,
  guardarJsonSession,
  hayPendienteAuth,
  leerJsonSession,
  leerYQuitarExitoSession,
  limpiarJsonSession,
  limpiarPendienteAuth,
  marcarPendienteAuth,
} from "@/lib/borrador/session-storage";

const CLAVE_BORRADOR = "pawpatroll:borrador-avistamiento";
const CLAVE_EXITO = "pawpatroll:avistamiento-exito";
const CLAVE_PENDIENTE_AUTH = "pawpatroll:avistamiento-pendiente-auth";

export function marcarAvistamientoPendienteAuth() {
  marcarPendienteAuth(CLAVE_PENDIENTE_AUTH);
}

export function hayAvistamientoPendienteAuth(): boolean {
  return hayPendienteAuth(CLAVE_PENDIENTE_AUTH);
}

export function limpiarAvistamientoPendienteAuth() {
  limpiarPendienteAuth(CLAVE_PENDIENTE_AUTH);
}

export type BorradorAvistamiento = {
  datos: DatosAvistamiento;
  guardadoEn: string;
};

export type ExitoAvistamientoPendiente = {
  mensaje: string;
  numeroReporte?: number;
};

export function guardarBorradorAvistamiento(datos: DatosAvistamiento): boolean {
  const payload: BorradorAvistamiento = {
    datos,
    guardadoEn: new Date().toISOString(),
  };
  return guardarJsonSession(CLAVE_BORRADOR, payload);
}

export function leerBorradorAvistamiento(): BorradorAvistamiento | null {
  return leerJsonSession<BorradorAvistamiento>(CLAVE_BORRADOR);
}

export function limpiarBorradorAvistamiento() {
  limpiarJsonSession(CLAVE_BORRADOR);
  limpiarAvistamientoPendienteAuth();
}

export function guardarExitoAvistamiento(exito: ExitoAvistamientoPendiente) {
  guardarExitoSession(CLAVE_EXITO, exito);
}

export function leerYQuitarExitoAvistamiento(): ExitoAvistamientoPendiente | null {
  return leerYQuitarExitoSession<ExitoAvistamientoPendiente>(CLAVE_EXITO);
}
