/**
 * Librería (notificaciones): navegador.
 */
const CLAVE_PERMISO_SOLICITADO = "pp-notif-navegador-solicitado";

export function notificacionesNavegadorDisponibles(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function permisoNotificacionesNavegador(): NotificationPermission | "unsupported" {
  if (!notificacionesNavegadorDisponibles()) return "unsupported";
  return Notification.permission;
}

export async function solicitarPermisoNotificacionesNavegador(): Promise<
  NotificationPermission | "unsupported"
> {
  if (!notificacionesNavegadorDisponibles()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/** Pide permiso una sola vez por navegador (al usar la app con sesión). */
export async function solicitarPermisoNotificacionesSiCorresponde(): Promise<void> {
  if (!notificacionesNavegadorDisponibles()) return;
  if (Notification.permission !== "default") return;
  try {
    if (localStorage.getItem(CLAVE_PERMISO_SOLICITADO) === "1") return;
    localStorage.setItem(CLAVE_PERMISO_SOLICITADO, "1");
    await Notification.requestPermission();
  } catch {
    /* ignorar */
  }
}

type OpcionesNotificacion = {
  titulo: string;
  cuerpo?: string | null;
  enlace?: string | null;
};

export function mostrarNotificacionNavegador({
  titulo,
  cuerpo,
  enlace,
}: OpcionesNotificacion): void {
  if (!notificacionesNavegadorDisponibles()) return;
  if (Notification.permission !== "granted") return;
  if (typeof document !== "undefined" && !document.hidden) return;

  try {
    const n = new Notification(titulo, {
      body: cuerpo?.trim() || undefined,
      icon: "/favicon.ico",
      tag: enlace ?? titulo,
    });
    n.onclick = () => {
      window.focus();
      n.close();
      if (enlace) window.location.assign(enlace);
    };
  } catch {
    /* ignorar */
  }
}
