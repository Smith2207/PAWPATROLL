/**
 * Librería (perdidas): borrador-cliente.
 */
import type { DatosFichaMascota } from "@/lib/db/schema";
import { crearApiBorrador } from "@/lib/borrador/crear-borrador-cliente";
import {
  SESSION_BORRADOR_PERDIDA,
  SESSION_EXITO_PERDIDA,
  SESSION_PENDIENTE_AUTH_PERDIDA,
} from "@/lib/claves-session-cliente";

const api = crearApiBorrador<BorradorReportePerdida, ExitoPerdidaPendiente>({
  borrador: SESSION_BORRADOR_PERDIDA,
  exito: SESSION_EXITO_PERDIDA,
  pendienteAuth: SESSION_PENDIENTE_AUTH_PERDIDA,
});

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

export const marcarPerdidaPendienteAuth = api.marcarPendienteAuth;
export const hayPerdidaPendienteAuth = api.hayPendienteAuth;
export const limpiarPerdidaPendienteAuth = api.limpiarPendienteAuth;
export const guardarBorradorPerdida = api.guardarBorrador;
export const leerBorradorPerdida = api.leerBorrador;
export const limpiarBorradorPerdida = api.limpiarBorrador;
export const guardarExitoPerdida = api.guardarExito;
export const leerYQuitarExitoPerdida = api.leerYQuitarExito;
