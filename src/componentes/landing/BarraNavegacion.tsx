"use client";

import { MenuUsuario } from "@/componentes/auth/MenuUsuario";
import { irASeccion } from "@/hooks/useNavegacionSecciones";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const ENLACES = [
  { id: "inicio", etiqueta: "Inicio" },
  { id: "buscar", etiqueta: "Buscar mascota" },
  { id: "avistamientos", etiqueta: "Avistamientos" },
  { id: "comunidad", etiqueta: "Comunidad" },
  { id: "como-funciona", etiqueta: "Cómo funciona" },
] as const;

export function BarraNavegacion() {
  const { status } = useSession();
  const sesionActiva = status === "authenticated";
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuAbierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuAbierto]);

  function ir(id: string) {
    irASeccion(id);
    setMenuAbierto(false);
  }

  return (
    <nav className="nav-principal nav-principal--landing">
      <a
        className="logo"
        href="#inicio"
        onClick={(e) => {
          e.preventDefault();
          ir("inicio");
        }}
      >
        <div className="logo-icon">🐾</div>
        <span className="logo-texto">PawPatrol</span>
      </a>

      <div className="nav-centro nav-centro--escritorio">
        <div
          className={`nav-links ${sesionActiva ? "nav-links--con-sesion" : ""}`}
        >
          {ENLACES.map((enlace) => (
            <a
              key={enlace.id}
              href={`#${enlace.id}`}
              onClick={(e) => {
                e.preventDefault();
                ir(enlace.id);
              }}
            >
              {enlace.etiqueta}
            </a>
          ))}
          {sesionActiva && (
            <Link href="/mis-mascotas" className="nav-link-externo">
              Mis mascotas
            </Link>
          )}
        </div>
      </div>

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
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <div className={`nav-drawer ${menuAbierto ? "nav-drawer--abierto" : ""}`}>
        <div className="nav-drawer-links">
          {ENLACES.map((enlace) => (
            <a
              key={enlace.id}
              href={`#${enlace.id}`}
              onClick={(e) => {
                e.preventDefault();
                ir(enlace.id);
              }}
            >
              {enlace.etiqueta}
            </a>
          ))}
          {sesionActiva && (
            <Link href="/mis-mascotas" onClick={() => setMenuAbierto(false)}>
              Mis mascotas
            </Link>
          )}
        </div>
        <div className="nav-drawer-actions">
          <MenuUsuario enMenuMovil compacto={sesionActiva} />
        </div>
      </div>
    </nav>
  );
}
