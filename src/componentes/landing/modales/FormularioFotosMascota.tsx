"use client";

import { useCamaraReporte } from "@/hooks/useCamaraReporte";
import { useRef } from "react";

export function FormularioFotosMascota() {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    fotosPreview,
    camaraVisible,
    iaResultadoVisible,
    iaPreview,
    iaProgreso,
    iaTexto,
    previewFotos,
    abrirCamara,
    capturarFoto,
    cerrarCamara,
    ocultarResultadoIa,
  } = useCamaraReporte();

  return (
    <>
      <div className="section-divider">Fotos de la mascota</div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        <div
          className="photo-upload"
          style={{ marginBottom: 0 }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => previewFotos(e.target)}
          />
          <div className="photo-upload-icon">🖼️</div>
          <div className="photo-upload-text">
            <span
              style={{
                fontSize: "0.82rem",
                fontWeight: 800,
                color: "var(--navy)",
                display: "block",
                marginBottom: 3,
              }}
            >
              Subir fotos
            </span>
            Hasta 5 fotos de tu mascota
            <br />
            <span className="photo-upload-cta">La IA las analiza</span>
          </div>
          {fotosPreview.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 4,
                flexWrap: "wrap",
                justifyContent: "center",
                marginTop: 6,
              }}
            >
              {fotosPreview.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Vista previa ${i + 1}`}
                  style={{
                    width: 44,
                    height: 44,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "2px solid #BFDBFE",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div
          className="photo-upload"
          style={{
            marginBottom: 0,
            borderColor: "#A7F3D0",
            background: "linear-gradient(135deg,#F0FDF8,#ECFDF5)",
            cursor: "pointer",
          }}
          onClick={abrirCamara}
          onKeyDown={(e) => e.key === "Enter" && abrirCamara()}
          role="button"
          tabIndex={0}
        >
          <div className="photo-upload-icon">📸</div>
          <div className="photo-upload-text">
            <span
              style={{
                fontSize: "0.82rem",
                fontWeight: 800,
                color: "#065F46",
                display: "block",
                marginBottom: 3,
              }}
            >
              Tomar foto · IA
            </span>
            Apunta a la mascota
            <br />
            <span style={{ color: "var(--mint)", fontWeight: 800 }}>
              Identificación automática
            </span>
          </div>
          <div
            style={{
              marginTop: 6,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "#D1FAE5",
              border: "1px solid #6EE7B7",
              borderRadius: 20,
              padding: "2px 10px",
              fontSize: "0.68rem",
              fontWeight: 800,
              color: "#065F46",
            }}
          >
            🤖 Reconocimiento por foto
          </div>
        </div>
      </div>

      {camaraVisible && (
        <div
          style={{
            marginBottom: "1rem",
            border: "2px solid #6EE7B7",
            borderRadius: "var(--radius-sm)",
            overflow: "hidden",
            background: "#000",
            position: "relative",
          }}
        >
          <video
            id="camara-video-reporte"
            autoPlay
            playsInline
            style={{
              width: "100%",
              maxHeight: 220,
              objectFit: "cover",
              display: "block",
            }}
          />
          <canvas id="camara-canvas-reporte" style={{ display: "none" }} />
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              display: "flex",
              gap: 6,
            }}
          >
            <button
              type="button"
              onClick={capturarFoto}
              style={{
                background: "var(--mint)",
                color: "white",
                border: "none",
                borderRadius: 50,
                padding: "6px 14px",
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 800,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              📸 Capturar
            </button>
            <button
              type="button"
              onClick={cerrarCamara}
              style={{
                background: "rgba(0,0,0,0.5)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: 30,
                height: 30,
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {iaResultadoVisible && (
        <div
          style={{
            background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)",
            border: "1.5px solid #6EE7B7",
            borderRadius: "var(--radius-sm)",
            padding: "0.9rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {iaPreview && (
              <img
                src={iaPreview}
                alt="Captura"
                style={{
                  width: 64,
                  height: 64,
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "2px solid #A7F3D0",
                }}
              />
            )}
            <div>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: "#065F46",
                  marginBottom: 4,
                }}
              >
                🤖 IA analizando imagen...
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#047857",
                  fontWeight: 700,
                }}
              >
                {iaTexto}
              </div>
            </div>
            <button
              type="button"
              onClick={ocultarResultadoIa}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: "#6B7280",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                height: 4,
                background: "#A7F3D0",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: 4,
                  background: "var(--mint)",
                  borderRadius: 4,
                  width: `${iaProgreso}%`,
                  transition: "width 2s ease",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
