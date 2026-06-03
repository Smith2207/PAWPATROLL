"use client";

import { MenuUsuario } from "@/componentes/auth/MenuUsuario";
import { Icono } from "@/componentes/ui/Icono";
import { EnlaceChatsNav } from "@/componentes/layout/EnlaceChatsNav";
import { CampanaNotificaciones } from "@/componentes/notificaciones/CampanaNotificaciones";
import { EnlaceMisMascotasNav } from "@/componentes/layout/EnlaceMisMascotasNav";
import {
  ENLACES_NAV,
  ENLACES_NAV_EXPLORAR,
  ENLACES_NAV_SESION,
  RUTAS_LANDING,
} from "@/lib/landing/rutas";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

function enlaceActivo(pathname: string, href: string) {
  if (href === RUTAS_LANDING.inicio) return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BarraNavegacionApp() {
  const pathname = usePathname();
  const { status } = useSession();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const sesionActiva = status === "authenticated";

  useEffect(() => {
    document.body.style.overflow = menuAbierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuAbierto]);

  function cerrar() {
    setMenuAbierto(false);
  }

  const enlacesCentro = sesionActiva ? ENLACES_NAV_SESION : ENLACES_NAV;

  return (
    <nav className="nav-principal nav-principal--app">
      <Link className="logo" href="/" onClick={cerrar}>
        <div className="logo-icon">
          <Icono nombre="huella" size={20} />
        </div>
        <span className="logo-texto">PawPatrol</span>
      </Link>

      <div className="nav-centro nav-centro--escritorio">
        <div
          className={`nav-links nav-links--app ${sesionActiva ? "nav-links--con-sesion" : ""}`}
        >
          {enlacesCentro.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className={
                enlaceActivo(pathname, enlace.href)
                  ? "nav-link--activo"
                  : undefined
              }
              aria-current={
                enlaceActivo(pathname, enlace.href) ? "page" : undefined
              }
            >
              {enlace.etiqueta}
            </Link>
          ))}
          {sesionActiva && (
            <>
              <EnlaceChatsNav pathname={pathname} />
              <EnlaceMisMascotasNav pathname={pathname} />
            </>
          )}
        </div>
      </div>

      <div className="nav-actions nav-actions--escritorio">
        <CampanaNotificaciones />
        <MenuUsuario compacto={sesionActiva} />
      </div>

      <button
        type="button"
        className="nav-menu-btn"
        aria-expanded={menuAbierto}
        aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setMenuAbierto((v) => !v)}
      >
        {menuAbierto ? (
          <Icono nombre="cerrar" size={22} />
        ) : (
          <Icono nombre="menu" size={22} />
        )}
      </button>

      {menuAbierto && (
        <button
          type="button"
          className="nav-overlay"
          aria-label="Cerrar menú"
          onClick={cerrar}
        />
      )}

      <div className={`nav-drawer ${menuAbierto ? "nav-drawer--abierto" : ""}`}>
        <div className="nav-drawer-links">
          {enlacesCentro.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className={
                enlaceActivo(pathname, enlace.href)
                  ? "nav-link--activo"
                  : undefined
              }
              onClick={cerrar}
            >
              {enlace.etiqueta}
            </Link>
          ))}
          {sesionActiva && (
            <>
              <EnlaceChatsNav pathname={pathname} onNavigate={cerrar} />
              <EnlaceMisMascotasNav pathname={pathname} onNavigate={cerrar} />
            </>
          )}
          {sesionActiva && (
            <div className="nav-drawer-seccion">
              <span className="nav-drawer-seccion-titulo">Explorar</span>
              {ENLACES_NAV_EXPLORAR.map((enlace) => (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  className={`nav-drawer-secundario ${
                    enlaceActivo(pathname, enlace.href)
                      ? "nav-link--activo"
                      : ""
                  }`.trim()}
                  onClick={cerrar}
                >
                  {enlace.etiqueta}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="nav-drawer-actions">
          <CampanaNotificaciones />
          <MenuUsuario enMenuMovil compacto={sesionActiva} />
        </div>
      </div>
    </nav>
  );
}
