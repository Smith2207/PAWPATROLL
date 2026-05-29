"use client";

import { useCamaraReporte } from "@/hooks/useCamaraReporte";
import { useRef } from "react";

export type CamaraReporteApi = ReturnType<typeof useCamaraReporte>;

type Props = {
  /** Si se pasa, las fotos las controla el formulario padre (envío) */
  camara?: CamaraReporteApi;
  idPrefijo?: string;
};

export function FormularioFotosMascota({
  camara: camaraExterna,
  idPrefijo = "reporte",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const camaraInterna = useCamaraReporte({ idPrefijo });
  const {
    fotosPreview,
    camaraVisible,
    previewFotos,
    abrirCamara,
    capturarFoto,
    cerrarCamara,
    ids,
  } = camaraExterna ?? camaraInterna;

  return (
    <>
      <div className="section-divider">Fotos de la mascota *</div>

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
              Tomar foto
            </span>
            Usa la cámara del dispositivo
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
            id={ids.video}
            autoPlay
            playsInline
            style={{
              width: "100%",
              maxHeight: 220,
              objectFit: "cover",
              display: "block",
            }}
          />
          <canvas id={ids.canvas} style={{ display: "none" }} />
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
    </>
  );
}
