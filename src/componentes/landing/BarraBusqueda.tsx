"use client";

import { useState } from "react";

const FILTROS = [
  { id: "perros", emoji: "🐕", texto: "Perros" },
  { id: "gatos", emoji: "🐱", texto: "Gatos" },
  { id: "cerca", emoji: "📍", texto: "Cerca de mí" },
  { id: "24h", emoji: "🕐", texto: "Últimas 24h" },
  { id: "ia", emoji: "🧠", texto: "Por foto IA" },
] as const;

export function BarraBusqueda() {
  const [filtroActivo, setFiltroActivo] = useState<string>("perros");

  return (
    <div className="search-section" id="buscar">
      <div className="search-inner">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre, raza, color, zona..."
          />
        </div>
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`filter-btn${filtroActivo === f.id ? " active" : ""}`}
            onClick={() => setFiltroActivo(f.id)}
          >
            {f.emoji} {f.texto}
          </button>
        ))}
        <button type="button" className="search-btn">
          🔍 Buscar
        </button>
      </div>
    </div>
  );
}
