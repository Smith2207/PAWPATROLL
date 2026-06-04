"use client";

import { useRef } from "react";
import { Icono } from "@/componentes/ui/Icono";
import type { CamaraReporteApi } from "@/hooks/useCamaraReporte";

type Props = {
  camara: CamaraReporteApi;
  titulo?: string;
  ayuda?: string;
};

export function FormularioFotosMascota({
  camara,
  titulo = "Fotos de la mascota *",
  ayuda = "Toca para elegir foto (galería o cámara). La primera será la principal.",
}: Props) {
  const inputGaleriaRef = useRef<HTMLInputElement>(null);
  const {
    fotosPreview,
    previewFotos,
    quitarFoto,
    marcarPrincipal,
    maxFotos,
  } = camara;

  return (
    <>
      <div className="section-divider">{titulo}</div>

      <p className="form-ficha-ayuda" style={{ marginBottom: "0.75rem" }}>
        {ayuda}
      </p>

      {fotosPreview.length > 0 && (
        <div className="galeria-fotos" style={{ marginBottom: "1rem" }}>
          {fotosPreview.map((src, i) => (
            <div
              key={`${i}-${src.slice(0, 32)}`}
              className={`galeria-foto-item ${i === 0 ? "galeria-foto-item--principal" : ""}`}
            >
              <img src={src} alt={`Foto ${i + 1}`} />
              {i === 0 && <span className="galeria-foto-badge">Principal</span>}
              <div
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  display: "flex",
                  gap: 4,
                }}
              >
                {i !== 0 && (
                  <button
                    type="button"
                    title="Marcar como principal"
                    onClick={() => marcarPrincipal(i)}
                    style={{
                      background: "rgba(255,255,255,0.9)",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: "0.65rem",
                      padding: "2px 5px",
                    }}
                  >
                    <Icono nombre="estrella" size={14} />
                  </button>
                )}
                <button
                  type="button"
                  title="Quitar foto"
                  onClick={() => quitarFoto(i)}
                  style={{
                    background: "rgba(0,0,0,0.55)",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    width: 22,
                    height: 22,
                    cursor: "pointer",
                  }}
                >
                  <Icono nombre="cerrar" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {fotosPreview.length < maxFotos && (
        <>
          <div
            className="photo-upload"
            role="button"
            tabIndex={0}
            onClick={() => inputGaleriaRef.current?.click()}
            onKeyDown={(e) =>
              e.key === "Enter" && inputGaleriaRef.current?.click()
            }
          >
            <input
              ref={inputGaleriaRef}
              type="file"
              accept="image/*"
              multiple={maxFotos > 1}
              hidden
              onChange={(e) => previewFotos(e.target)}
            />
            <div className="photo-upload-icon">
              <Icono nombre="imagen" size={28} />
            </div>
            <div className="photo-upload-text">Elegir de galería</div>
          </div>

          <p className="form-ficha-ayuda" style={{ marginTop: "0.5rem" }}>
            {fotosPreview.length}/{maxFotos} fotos · JPG, PNG o WebP
          </p>
        </>
      )}
    </>
  );
}
