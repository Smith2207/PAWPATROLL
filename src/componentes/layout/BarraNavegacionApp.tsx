"use client";

import { MenuUsuario } from "@/componentes/auth/MenuUsuario";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const ENLACES_SESION = [
  { href: "/", etiqueta: "Inicio", exacto: true },
  { href: "/mis-mascotas", etiqueta: "Mis mascotas", exacto: false },
  { href: "/perfil", etiqueta: "Mi perfil", exacto: true },
] as const;

function enlaceActivo(pathname: string, href: string, exacto: boolean) {
  if (exacto) return pathname === href;
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

  return (
    <nav className="nav-principal nav-principal--app">
      <Link className="logo" href="/" onClick={cerrar}>
        <div className="logo-icon">🐾</div>
        <span className="logo-texto">PawPatrol</span>
      </Link>

      {sesionActiva && (
        <div className="nav-centro nav-centro--escritorio">
          <div className="nav-links nav-links--app">
            {ENLACES_SESION.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                className={
                  enlaceActivo(pathname, enlace.href, enlace.exacto)
                    ? "nav-link--activo"
                    : undefined
                }
                aria-current={
                  enlaceActivo(pathname, enlace.href, enlace.exacto)
                    ? "page"
                    : undefined
                }
              >
                {enlace.etiqueta}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="nav-actions nav-actions--escritorio">
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
        {sesionActiva && (
          <div className="nav-drawer-links">
            {ENLACES_SESION.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                className={
                  enlaceActivo(pathname, enlace.href, enlace.exacto)
                    ? "nav-link--activo"
                    : undefined
                }
                onClick={cerrar}
              >
                {enlace.etiqueta}
              </Link>
            ))}
          </div>
        )}
        <div className="nav-drawer-actions">
          <MenuUsuario enMenuMovil compacto />
        </div>
      </div>
    </nav>
  );
}
