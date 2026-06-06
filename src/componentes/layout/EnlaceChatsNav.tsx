"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { contarChatsNoLeidos } from "@/actions/casos";
import { RUTAS_LANDING } from "@/lib/landing/rutas";
import { Icono } from "@/componentes/ui/Icono";
import { useRespaldoActualizacion } from "@/hooks/useRespaldoActualizacion";
import { useTiempoReal } from "@/hooks/useTiempoReal";

function rutaChatsActiva(pathname: string) {
  if (
    pathname === RUTAS_LANDING.chats ||
    pathname.startsWith(`${RUTAS_LANDING.chats}/`)
  ) {
    return true;
  }
  return pathname.includes("/caso");
}

type Props = {
  pathname: string;
  onNavigate?: () => void;
};

export function EnlaceChatsNav({ pathname, onNavigate }: Props) {
  const { data: sesion, status } = useSession();
  const [noLeidos, setNoLeidos] = useState(0);

  const recargar = useCallback(async () => {
    const n = await contarChatsNoLeidos();
    setNoLeidos(n);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelado = false;
    void (async () => {
      const n = await contarChatsNoLeidos();
      if (!cancelado) setNoLeidos(n);
    })();
    return () => {
      cancelado = true;
    };
  }, [status]);

  const userId = sesion?.user?.id;
  const { conectado: wsConectado } = useTiempoReal(
    userId ? [`usuario:${userId}`] : [],
    (ev) => {
      if (
        ev.tipo === "notificacion:nueva" ||
        ev.tipo === "mensaje:nuevo" ||
        ev.tipo === "chat:leido"
      ) {
        void recargar();
      }
    }
  );

  useRespaldoActualizacion(() => {
    if (status === "authenticated") void recargar();
  }, wsConectado, 12_000);

  if (status !== "authenticated") return null;

  const activo = rutaChatsActiva(pathname);
  const badge = noLeidos > 0 ? (noLeidos > 9 ? "9+" : noLeidos) : null;

  return (
    <Link
      href={RUTAS_LANDING.chats}
      className={`nav-link-chats ${activo ? "nav-link--activo" : ""}`}
      aria-current={activo ? "page" : undefined}
      aria-label={badge ? `Mensajes, ${badge} sin leer` : "Mensajes"}
      onClick={onNavigate}
      title={
        noLeidos > 0
          ? `${badge} mensaje${noLeidos === 1 ? "" : "s"} sin leer`
          : undefined
      }
    >
      <Icono nombre="mensaje" size={16} className="nav-link-chats-icono" />
      Mensajes
      {badge != null && (
        <span className="nav-link-mascotas-badge" aria-hidden>
          {badge}
        </span>
      )}
    </Link>
  );
}
