import type { DatosAvistamiento } from "@/actions/avistamientos";

const CLAVE_BORRADOR = "pawpatroll:borrador-avistamiento";
const CLAVE_EXITO = "pawpatroll:avistamiento-exito";
const CLAVE_PENDIENTE_AUTH = "pawpatroll:avistamiento-pendiente-auth";

export function marcarAvistamientoPendienteAuth() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CLAVE_PENDIENTE_AUTH, "1");
}

export function hayAvistamientoPendienteAuth(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(CLAVE_PENDIENTE_AUTH) === "1";
}

export function limpiarAvistamientoPendienteAuth() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CLAVE_PENDIENTE_AUTH);
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
  if (typeof window === "undefined") return false;
  try {
    const payload: BorradorAvistamiento = {
      datos,
      guardadoEn: new Date().toISOString(),
    };
    sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function leerBorradorAvistamiento(): BorradorAvistamiento | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CLAVE_BORRADOR);
    if (!raw) return null;
    return JSON.parse(raw) as BorradorAvistamiento;
  } catch {
    return null;
  }
}

export function limpiarBorradorAvistamiento() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CLAVE_BORRADOR);
  limpiarAvistamientoPendienteAuth();
}

export function guardarExitoAvistamiento(exito: ExitoAvistamientoPendiente) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CLAVE_EXITO, JSON.stringify(exito));
}

export function leerYQuitarExitoAvistamiento(): ExitoAvistamientoPendiente | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CLAVE_EXITO);
    if (!raw) return null;
    sessionStorage.removeItem(CLAVE_EXITO);
    return JSON.parse(raw) as ExitoAvistamientoPendiente;
  } catch {
    return null;
  }
}
