"use client";



/**
 * [mascotas] Componente React: visor lightbox fotos.
 */
/**
 * [mascotas] Componente React: visor lightbox fotos.
 */
import { useEffect } from "react";
import { Icono } from "@/componentes/ui/Icono";

type Foto = { id: string; url: string };

type Props = {
  fotos: Foto[];
  indice: number;
  nombre: string;
  abierto: boolean;
  onCerrar: () => void;
  onCambiarIndice: (i: number) => void;
};

export function VisorLightboxFotos({
  fotos,
  indice,
  nombre,
  abierto,
  onCerrar,
  onCambiarIndice,
}: Props) {
  const total = fotos.length;
  const actual = fotos[indice];

  useEffect(() => {
    if (!abierto) return;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
      if (e.key === "ArrowLeft" && total > 1) onCambiarIndice((indice - 1 + total) % total);
      if (e.key === "ArrowRight" && total > 1) onCambiarIndice((indice + 1) % total);
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [abierto, indice, total, onCerrar, onCambiarIndice]);

  if (!abierto || !actual) return null;

  return (
    <div
      className="lightbox-ficha"
      role="dialog"
      aria-modal="true"
      aria-label={`Vista ampliada de ${nombre}`}
      onClick={onCerrar}
    >
      <button
        type="button"
        className="lightbox-ficha-cerrar"
        aria-label="Cerrar vista ampliada"
        onClick={onCerrar}
      >
        <Icono nombre="cerrar" size={18} />
      </button>

      {total > 1 && (
        <>
          <button
            type="button"
            className="lightbox-ficha-flecha lightbox-ficha-flecha--izq"
            aria-label="Foto anterior"
            onClick={(e) => {
              e.stopPropagation();
              onCambiarIndice((indice - 1 + total) % total);
            }}
          >
            <Icono nombre="izquierda" size={22} />
          </button>
          <button
            type="button"
            className="lightbox-ficha-flecha lightbox-ficha-flecha--der"
            aria-label="Foto siguiente"
            onClick={(e) => {
              e.stopPropagation();
              onCambiarIndice((indice + 1) % total);
            }}
          >
            <Icono nombre="derecha" size={22} />
          </button>
          <span className="lightbox-ficha-contador">
            {indice + 1} / {total}
          </span>
        </>
      )}

      <div className="lightbox-ficha-contenido" onClick={(e) => e.stopPropagation()}>
        <img src={actual.url} alt={`${nombre} — ampliada`} />
      </div>
    </div>
  );
}
