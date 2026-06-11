"use client";



/**
 * [layout] Componente React: enlace mis mascotas nav.
 */
import { obtenerResumenCasosNav } from "@/actions/mascotas/consultas-nav";
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

function hrefInicial(pathname: string) {
  return enlaceMisMascotasActivo(pathname) ? pathname : "/mis-mascotas";
}

export function EnlaceMisMascotasNav({ pathname, className, onNavigate }: Props) {
  const { status } = useSession();
  const [href, setHref] = useState(() => hrefInicial(pathname));
  const [pendientes, setPendientes] = useState(0);

  const recargar = useCallback(async () => {
    const datos = await obtenerResumenCasosNav();
    setPendientes(datos.pendientes);
    if (!enlaceMisMascotasActivo(pathname)) {
      setHref(datos.href);
    }
  }, [pathname]);

  useEffect(() => {
    if (enlaceMisMascotasActivo(pathname)) {
      setHref(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelado = false;
    void (async () => {
      const datos = await obtenerResumenCasosNav();
      if (!cancelado) {
        setPendientes(datos.pendientes);
        if (!enlaceMisMascotasActivo(pathname)) {
          setHref(datos.href);
        }
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [status, pathname]);

  if (status !== "authenticated") return null;

  const activo = enlaceMisMascotasActivo(pathname);
  const hrefDestino = activo ? pathname : href;
  const badge = pendientes > 0 ? pendientes : null;

  return (
    <Link
      href={hrefDestino}
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
