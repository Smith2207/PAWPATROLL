import type { DatosFichaMascota } from "@/lib/db/schema";

const CLAVE_BORRADOR = "pawpatroll:borrador-perdida";
const CLAVE_EXITO = "pawpatroll:perdida-exito";
const CLAVE_PENDIENTE_AUTH = "pawpatroll:perdida-pendiente-auth";

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
  /** Campos extra para restaurar el formulario */
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
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CLAVE_PENDIENTE_AUTH, "1");
}

export function hayPerdidaPendienteAuth(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(CLAVE_PENDIENTE_AUTH) === "1";
}

export function limpiarPerdidaPendienteAuth() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CLAVE_PENDIENTE_AUTH);
}

export function guardarBorradorPerdida(borrador: BorradorReportePerdida): boolean {
  if (typeof window === "undefined") return false;
  try {
    sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(borrador));
    return true;
  } catch {
    return false;
  }
}

export function leerBorradorPerdida(): BorradorReportePerdida | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CLAVE_BORRADOR);
    if (!raw) return null;
    return JSON.parse(raw) as BorradorReportePerdida;
  } catch {
    return null;
  }
}

export function limpiarBorradorPerdida() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CLAVE_BORRADOR);
  limpiarPerdidaPendienteAuth();
}

export function guardarExitoPerdida(exito: ExitoPerdidaPendiente) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CLAVE_EXITO, JSON.stringify(exito));
}

export function leerYQuitarExitoPerdida(): ExitoPerdidaPendiente | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CLAVE_EXITO);
    if (!raw) return null;
    sessionStorage.removeItem(CLAVE_EXITO);
    return JSON.parse(raw) as ExitoPerdidaPendiente;
  } catch {
    return null;
  }
}
