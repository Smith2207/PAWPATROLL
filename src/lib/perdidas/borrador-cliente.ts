import type { DatosFichaMascota } from "@/lib/db/schema";
import {
  SESSION_BORRADOR_PERDIDA,
  SESSION_EXITO_PERDIDA,
  SESSION_PENDIENTE_AUTH_PERDIDA,
} from "@/lib/claves-session-cliente";
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

const CLAVE_BORRADOR = SESSION_BORRADOR_PERDIDA;
const CLAVE_EXITO = SESSION_EXITO_PERDIDA;
const CLAVE_PENDIENTE_AUTH = SESSION_PENDIENTE_AUTH_PERDIDA;

export type DatosPerdidaBorrador = {
  lugarPerdida: string;
  fechaPerdida?: string;
  latPerdida: number;
  lngPerdida: number;
  notas?: string;
};

export type BorradorReportePerdida = {
  datosMascota: DatosFichaMascota;
  fotos: string[];
  perdida: DatosPerdidaBorrador;
  guardadoEn: string;
  referenciasZona?: string;
  contactoNombre?: string;
  contactoTelefono?: string;
  contactoEmail?: string;
  recompensa?: string;
};

export type ExitoPerdidaPendiente = {
  mensaje: string;
  slug?: string;
};

export function marcarPerdidaPendienteAuth() {
  marcarPendienteAuth(CLAVE_PENDIENTE_AUTH);
}

export function hayPerdidaPendienteAuth(): boolean {
  return hayPendienteAuth(CLAVE_PENDIENTE_AUTH);
}

export function limpiarPerdidaPendienteAuth() {
  limpiarPendienteAuth(CLAVE_PENDIENTE_AUTH);
}

export function guardarBorradorPerdida(borrador: BorradorReportePerdida): boolean {
  return guardarJsonSession(CLAVE_BORRADOR, borrador);
}

export function leerBorradorPerdida(): BorradorReportePerdida | null {
  return leerJsonSession<BorradorReportePerdida>(CLAVE_BORRADOR);
}

export function limpiarBorradorPerdida() {
  limpiarJsonSession(CLAVE_BORRADOR);
  limpiarPerdidaPendienteAuth();
}

export function guardarExitoPerdida(exito: ExitoPerdidaPendiente) {
  guardarExitoSession(CLAVE_EXITO, exito);
}

export function leerYQuitarExitoPerdida(): ExitoPerdidaPendiente | null {
  return leerYQuitarExitoSession<ExitoPerdidaPendiente>(CLAVE_EXITO);
}
