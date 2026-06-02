"use client";

import { obtenerResumenCasosNav } from "@/actions/resumen-casos-nav";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

type Props = {
  pathname: string;
  className?: string;
  onNavigate?: () => void;
};

function enlaceMisMascotasActivo(pathname: string) {
  return pathname === "/mis-mascotas" || pathname.startsWith("/mis-mascotas/");
}

export function EnlaceMisMascotasNav({ pathname, className, onNavigate }: Props) {
  const { status } = useSession();
  const [href, setHref] = useState("/mis-mascotas");
  const [pendientes, setPendientes] = useState(0);

  const recargar = useCallback(async () => {
    const datos = await obtenerResumenCasosNav();
    setHref(datos.href);
    setPendientes(datos.pendientes);
  }, []);

  useEffect(() => {
    if (status === "authenticated") void recargar();
  }, [status, pathname, recargar]);

  if (status !== "authenticated") return null;

  const activo = enlaceMisMascotasActivo(pathname);
  const badge = pendientes > 0 ? pendientes : null;

  return (
    <Link
      href={href}
      className={`nav-link-mascotas ${activo ? "nav-link--activo" : ""} ${className ?? ""}`.trim()}
      aria-current={activo ? "page" : undefined}
      onClick={onNavigate}
      title={
        badge != null
          ? `${badge} avistamiento${badge === 1 ? "" : "s"} por revisar`
          : undefined
      }
    >
      Mis mascotas
      {badge != null && (
        <span className="nav-link-mascotas-badge" aria-hidden>
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}
