"use client";

import { MenuUsuario } from "@/componentes/auth/MenuUsuario";
import { CampanaNotificaciones } from "@/componentes/notificaciones/CampanaNotificaciones";
import { ENLACES_NAV, RUTAS_LANDING } from "@/lib/landing/rutas";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const ENLACES_CUENTA = [
  { href: "/mis-mascotas", etiqueta: "Mis mascotas" },
  { href: "/notificaciones", etiqueta: "Notificaciones" },
  { href: "/perfil", etiqueta: "Mi perfil" },
] as const;

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

  const enlaces = [
    ...ENLACES_NAV,
    ...(sesionActiva ? ENLACES_CUENTA : []),
  ];

  return (
    <nav className="nav-principal nav-principal--app">
      <Link className="logo" href="/" onClick={cerrar}>
        <div className="logo-icon">🐾</div>
        <span className="logo-texto">PawPatrol</span>
      </Link>

      <div className="nav-centro nav-centro--escritorio">
        <div
          className={`nav-links nav-links--app ${sesionActiva ? "nav-links--con-sesion" : ""}`}
        >
          {enlaces.map((enlace) => (
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
        {menuAbierto ? "✕" : "☰"}
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
          {enlaces.map((enlace) => (
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
        </div>
        <div className="nav-drawer-actions">
          <CampanaNotificaciones />
          <MenuUsuario enMenuMovil compacto={sesionActiva} />
        </div>
      </div>
    </nav>
  );
}
