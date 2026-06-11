"use client";



/**
 * [notificaciones] Escuchador: notificaciones navegador.
 */
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useTiempoReal } from "@/hooks/useTiempoReal";
import {
  mostrarNotificacionNavegador,
  solicitarPermisoNotificacionesSiCorresponde,
} from "@/lib/notificaciones/navegador";

function esRutaChatCoordinacion(pathname: string) {
  return (
    pathname.startsWith("/chats") ||
    pathname.startsWith("/avistamiento/") ||
    /\/mis-mascotas\/[^/]+\/caso$/.test(pathname)
  );
}

function usuarioEnPaginaDelMensaje(pathname: string, enlace?: string | null) {
  if (enlace) {
    const base = enlace.split("?")[0]?.split("#")[0] ?? enlace;
    return pathname === base || pathname.startsWith(`${base}/`);
  }
  return esRutaChatCoordinacion(pathname);
}

/** Avisos del sistema cuando la pestaña no está visible. */
export function EscuchadorNotificacionesNavegador() {
  const { data: sesion, status } = useSession();
  const pathname = usePathname();
  const userId = sesion?.user?.id;

  useEffect(() => {
    if (status === "authenticated") {
      void solicitarPermisoNotificacionesSiCorresponde();
    }
  }, [status]);

  useTiempoReal(userId ? [`usuario:${userId}`] : [], (ev) => {
    if (status !== "authenticated") return;
    if (ev.tipo !== "notificacion:nueva") return;
    if (ev.notifTipo && ev.notifTipo !== "MENSAJE_NUEVO") return;
    if (usuarioEnPaginaDelMensaje(pathname, ev.enlace)) return;

    mostrarNotificacionNavegador({
      titulo: ev.titulo ?? "Nuevo mensaje",
      cuerpo: ev.cuerpo,
      enlace: ev.enlace,
    });
  });

  return null;
}
