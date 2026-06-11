"use client";



/**
 * [mapa] Componente React: leyenda mapa colapsable.
 */
/**
 * [mapa] Componente React: leyenda mapa colapsable.
 */
import { useState } from "react";

type Item = { color: string; texto: string };

type Props = {
  items: Item[];
  titulo?: string;
};

export function LeyendaMapaColapsable({
  items,
  titulo = "¿Qué significan los colores?",
}: Props) {
  const [abierta, setAbierta] = useState(false);

  return (
    <div className="pp-leyenda-colapsable">
      <button
        type="button"
        className="pp-leyenda-colapsable-btn"
        aria-expanded={abierta}
        onClick={() => setAbierta((v) => !v)}
      >
        {titulo}
        <span aria-hidden>{abierta ? "▾" : "▸"}</span>
      </button>
      {abierta && (
        <div className="pp-leyenda-colapsable-panel">
          {items.map((item) => (
            <span key={item.texto}>
              <i style={{ background: item.color }} /> {item.texto}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
