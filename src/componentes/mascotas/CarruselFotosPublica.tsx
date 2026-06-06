"use client";

import { VisorLightboxFotos } from "@/componentes/mascotas/VisorLightboxFotos";
import { Icono } from "@/componentes/ui/Icono";
import { useCallback, useEffect, useState } from "react";

type Foto = {
  id: string;
  url: string;
};

type Props = {
  fotos: Foto[];
  nombre: string;
};

export function CarruselFotosPublica({ fotos, nombre }: Props) {
  const [indice, setIndice] = useState(0);
  const [transicion, setTransicion] = useState(false);
  const [lightboxAbierto, setLightboxAbierto] = useState(false);
  const total = fotos.length;
  const indiceVisible = total > 0 ? indice % total : 0;
  const hayVarias = total > 1;

  const irA = useCallback(
    (nuevo: number) => {
      if (total === 0) return;
      setTransicion(true);
      window.setTimeout(() => {
        setIndice((nuevo + total) % total);
        setTransicion(false);
      }, 140);
    },
    [total]
  );

  useEffect(() => {
    if (!hayVarias || lightboxAbierto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") irA(indiceVisible - 1);
      if (e.key === "ArrowRight") irA(indiceVisible + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hayVarias, indiceVisible, irA, lightboxAbierto]);

  if (total === 0) {
    return (
      <div className="carrusel-ficha carrusel-ficha--vacio" aria-label="Sin fotos">
        <span className="carrusel-ficha-placeholder">
          <Icono nombre="huella" size={48} />
        </span>
        <span className="carrusel-ficha-sin-foto">Sin fotos disponibles</span>
      </div>
    );
  }

  const actual = fotos[indiceVisible]!;

  return (
    <>
      <div
        className="carrusel-ficha"
        aria-roledescription="carrusel"
        aria-label={`Fotos de ${nombre}`}
      >
        <div className="carrusel-ficha-marco">
          <div className="carrusel-ficha-vista">
            <button
              type="button"
              className="carrusel-ficha-zoom"
              onClick={() => setLightboxAbierto(true)}
              aria-label="Ver foto ampliada"
            >
              <img
                key={actual.id}
                src={actual.url}
                alt={`${nombre} — foto ${indiceVisible + 1} de ${total}`}
                className={`carrusel-ficha-imagen ${transicion ? "carrusel-ficha-imagen--fade" : ""}`}
              />
              <span className="carrusel-ficha-zoom-hint">
                <Icono nombre="buscar" size={14} className="pp-icon--btn" /> Clic para ampliar
              </span>
            </button>

            {hayVarias && (
              <>
                <button
                  type="button"
                  className="carrusel-ficha-flecha carrusel-ficha-flecha--izq"
                  onClick={(e) => {
                    e.stopPropagation();
                    irA(indiceVisible - 1);
                  }}
                  aria-label="Foto anterior"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M15 6l-6 6 6 6"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="carrusel-ficha-flecha carrusel-ficha-flecha--der"
                  onClick={(e) => {
                    e.stopPropagation();
                    irA(indiceVisible + 1);
                  }}
                  aria-label="Foto siguiente"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M9 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div className="carrusel-ficha-puntos" role="tablist" aria-label="Indicador de foto">
                  {fotos.map((foto, i) => (
                    <button
                      key={foto.id}
                      type="button"
                      role="tab"
                      aria-selected={i === indiceVisible}
                      aria-label={`Foto ${i + 1}`}
                      className={`carrusel-ficha-punto ${i === indiceVisible ? "carrusel-ficha-punto--activo" : ""}`}
                      onClick={() => setIndice(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {hayVarias && (
            <div className="carrusel-ficha-miniaturas" role="tablist" aria-label="Elegir foto">
              {fotos.map((foto, i) => (
                <button
                  key={foto.id}
                  type="button"
                  role="tab"
                  aria-selected={i === indiceVisible}
                  aria-label={`Ver foto ${i + 1}`}
                  className={`carrusel-ficha-mini ${i === indiceVisible ? "carrusel-ficha-mini--activa" : ""}`}
                  onClick={() => setIndice(i)}
                >
                  <img src={foto.url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <VisorLightboxFotos
        fotos={fotos}
        indice={indiceVisible}
        nombre={nombre}
        abierto={lightboxAbierto}
        onCerrar={() => setLightboxAbierto(false)}
        onCambiarIndice={setIndice}
      />
    </>
  );
}
