/**
 * Librería (borrador): crear-borrador-cliente.
 */
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

export type ClavesBorrador = {
  borrador: string;
  exito: string;
  pendienteAuth: string;
};

/** API de sessionStorage compartida por avistamientos y reportes de pérdida. */
export function crearApiBorrador<TBorrador, TExito>(claves: ClavesBorrador) {
  return {
    marcarPendienteAuth: () => marcarPendienteAuth(claves.pendienteAuth),
    hayPendienteAuth: () => hayPendienteAuth(claves.pendienteAuth),
    limpiarPendienteAuth: () => limpiarPendienteAuth(claves.pendienteAuth),
    guardarBorrador: (borrador: TBorrador) =>
      guardarJsonSession(claves.borrador, borrador),
    leerBorrador: () => leerJsonSession<TBorrador>(claves.borrador),
    limpiarBorrador: () => {
      limpiarJsonSession(claves.borrador);
      limpiarPendienteAuth(claves.pendienteAuth);
    },
    guardarExito: (exito: TExito) => guardarExitoSession(claves.exito, exito),
    leerYQuitarExito: () => leerYQuitarExitoSession<TExito>(claves.exito),
  };
}
