"use client";

import { useCamaraReporte } from "@/hooks/useCamaraReporte";
import { useRef } from "react";

export type CamaraReporteApi = ReturnType<typeof useCamaraReporte>;

type Props = {
  camara: CamaraReporteApi;
};

export function FormularioFotosMascota({ camara }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    fotosPreview,
    previewFotos,
    quitarFoto,
    marcarPrincipal,
    maxFotos,
  } = camara;

  function alElegirArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    previewFotos(e.target);
  }

  return (
    <>
      <div className="section-divider">Fotos de la mascota *</div>

      <p className="form-ficha-ayuda" style={{ marginBottom: "0.75rem" }}>
        Sube fotos claras de tu mascota (cara y cuerpo). En el móvil puedes
        elegir galería o cámara. Si te equivocas, quita la foto con ✕ y añade
        otra.
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
                    ★
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
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {fotosPreview.length < maxFotos && (
        <div
          className="subir-fotos-zona"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            hidden
            onChange={alElegirArchivos}
          />
          <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>📷</div>
          <div
            style={{
              fontWeight: 800,
              color: "var(--navy)",
              fontSize: "0.85rem",
            }}
          >
            Añadir fotos ({fotosPreview.length}/{maxFotos})
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--muted)",
              marginTop: 4,
            }}
          >
            La primera foto será la principal
          </div>
        </div>
      )}
    </>
  );
}
