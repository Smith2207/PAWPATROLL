/** Utilidades genéricas de sessionStorage para borradores y flags de auth. */

export function marcarPendienteAuth(clave: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(clave, "1");
}

export function hayPendienteAuth(clave: string): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(clave) === "1";
}

export function limpiarPendienteAuth(clave: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(clave);
}

export function guardarJsonSession<T>(clave: string, valor: T): boolean {
  if (typeof window === "undefined") return false;
  try {
    sessionStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

export function leerJsonSession<T>(clave: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(clave);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function limpiarJsonSession(clave: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(clave);
}

export function guardarExitoSession<T>(clave: string, exito: T) {
  guardarJsonSession(clave, exito);
}

export function leerYQuitarExitoSession<T>(clave: string): T | null {
  const exito = leerJsonSession<T>(clave);
  if (exito) limpiarJsonSession(clave);
  return exito;
}
