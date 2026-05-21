"use client";

import { MenuUsuario } from "@/componentes/auth/MenuUsuario";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const ENLACES_SESION = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/mis-mascotas", etiqueta: "Mis mascotas" },
  { href: "/perfil", etiqueta: "Mi perfil" },
] as const;

export function BarraNavegacionApp() {
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
    <nav className="nav-principal">
      <Link className="logo" href="/" onClick={cerrar}>
        <div className="logo-icon">🐾</div>
        <span className="logo-texto">PawPatrol</span>
      </Link>

      {sesionActiva && (
        <div className="nav-centro nav-centro--escritorio">
          <div className="nav-links">
            {ENLACES_SESION.map((enlace) => (
              <Link key={enlace.href} href={enlace.href}>
                {enlace.etiqueta}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="nav-actions nav-actions--escritorio">
        <MenuUsuario />
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
              <Link key={enlace.href} href={enlace.href} onClick={cerrar}>
                {enlace.etiqueta}
              </Link>
            ))}
          </div>
        )}
        <div className="nav-drawer-actions">
          <MenuUsuario enMenuMovil />
        </div>
      </div>
    </nav>
  );
}
