"use client";



/**
 * [mascotas] Componente React: lightbox mapa ficha.
 */
import { useEffect, type ReactNode } from "react";
import { Icono } from "@/componentes/ui/Icono";

type Props = {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
};

export function LightboxMapaFicha({ abierto, titulo, onCerrar, children }: Props) {
  useEffect(() => {
    if (!abierto) return;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="lightbox-ficha lightbox-ficha--mapa"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onClick={onCerrar}
    >
      <button
        type="button"
        className="lightbox-ficha-cerrar"
        aria-label="Cerrar mapa ampliado"
        onClick={onCerrar}
      >
        <Icono nombre="cerrar" size={18} />
      </button>

      <div className="lightbox-ficha-mapa-panel" onClick={(e) => e.stopPropagation()}>
        <header className="lightbox-ficha-mapa-cabecera">
          <h2 className="lightbox-ficha-mapa-titulo">{titulo}</h2>
          <p className="lightbox-ficha-mapa-ayuda">
            Explora la zona, avistamientos y tu ubicación con más detalle.
          </p>
        </header>
        <div className="lightbox-ficha-mapa-cuerpo">{children}</div>
      </div>
    </div>
  );
}
