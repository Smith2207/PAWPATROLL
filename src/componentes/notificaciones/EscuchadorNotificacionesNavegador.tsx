"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useTiempoReal } from "@/hooks/useTiempoReal";
import {
  mostrarNotificacionNavegador,
  solicitarPermisoNotificacionesSiCorresponde,
} from "@/lib/notificaciones/navegador";

function usuarioEnPaginaDelMensaje(pathname: string, enlace?: string | null) {
  if (!enlace) return pathname.includes("/caso");
  const base = enlace.split("?")[0];
  if (pathname === base || pathname.startsWith(`${base}/`)) return true;
  if (base.includes("/caso") && pathname.includes("/caso")) return true;
  return false;
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
