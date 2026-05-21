"use client";

import { MenuUsuario } from "@/componentes/auth/MenuUsuario";
import { irASeccion } from "@/hooks/useNavegacionSecciones";

const ENLACES = [
  { id: "inicio", etiqueta: "Inicio" },
  { id: "buscar", etiqueta: "Buscar mascota" },
  { id: "avistamientos", etiqueta: "Avistamientos" },
  { id: "comunidad", etiqueta: "Comunidad" },
  { id: "como-funciona", etiqueta: "Cómo funciona" },
] as const;

export function BarraNavegacion() {
  return (
    <nav>
      <a
        className="logo"
        href="#inicio"
        onClick={(e) => {
          e.preventDefault();
          irASeccion("inicio");
        }}
      >
        <div className="logo-icon">🐾</div>
        PawPatrol
      </a>
      <div className="nav-links">
        {ENLACES.map((enlace) => (
          <a
            key={enlace.id}
            href={`#${enlace.id}`}
            onClick={(e) => {
              e.preventDefault();
              irASeccion(enlace.id);
            }}
          >
            {enlace.etiqueta}
          </a>
        ))}
      </div>
      <div className="nav-actions">
        <MenuUsuario />
      </div>
    </nav>
  );
}
