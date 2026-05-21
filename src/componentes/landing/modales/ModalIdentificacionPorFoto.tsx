"use client";

import { useModales } from "@/contexto/ContextoModales";
import { useCamaraRapida } from "@/hooks/useCamaraRapida";
import { useRef } from "react";
import {
  BotonCerrarModal,
  ModalContenedor,
} from "@/componentes/landing/modales/ModalContenedor";

export function ModalIdentificacionPorFoto() {
  const { abrirModal } = useModales();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    camaraActiva,
    resultadoVisible,
    fotoPreview,
    raza,
    color,
    confianza,
    progresoBarra,
    iniciarCamara,
    capturarYAnalizar,
    reiniciar,
    cerrarStream,
  } = useCamaraRapida();

  const alCerrar = () => {
    cerrarStream();
    reiniciar();
  };

  return (
    <ModalContenedor tipo="quickcam" anchoMaximo={420} alCerrar={alCerrar}>
      <div className="modal-header">
        <div className="modal-header-accent modal-header-accent--mint" />
        <BotonCerrarModal tipo="quickcam" alCerrar={alCerrar} />
        <div className="modal-title">📸 Identificar por foto</div>
        <div className="modal-sub">
          Apunta la cámara a la mascota y la IA la identificará
        </div>
      </div>
      <div className="modal-body" style={{ paddingTop: "1rem" }}>
        <div
          style={{
            background: "#0a0a0a",
            borderRadius: "var(--radius-sm)",
            overflow: "hidden",
            position: "relative",
            aspectRatio: "4/3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          <video
            ref={videoRef}
            id="qc-video"
            autoPlay
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: camaraActiva ? "block" : "none",
            }}
          />
          <canvas ref={canvasRef} id="qc-canvas" style={{ display: "none" }} />

          {camaraActiva && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: "65%",
                  aspectRatio: 1,
                  border: "2px solid rgba(16,185,129,0.7)",
                  borderRadius: 16,
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
                }}
              />
            </div>
          )}

          {!camaraActiva && !resultadoVisible && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                background: "#0F1923",
              }}
            >
              <div style={{ fontSize: "3rem" }}>📷</div>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.7)",
                  textAlign: "center",
                  padding: "0 1.5rem",
                }}
              >
                Toca el botón para activar
                <br />
                la cámara de tu dispositivo
              </div>
            </div>
          )}
        </div>

        {!camaraActiva && !resultadoVisible && (
          <button
            type="button"
            className="submit-btn submit-btn-blue"
            style={{ marginBottom: "0.7rem" }}
            onClick={() => iniciarCamara(videoRef.current)}
          >
            📷 Activar cámara
          </button>
        )}

        {camaraActiva && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            <button
              type="button"
              className="submit-btn"
              style={{
                background: "linear-gradient(135deg,var(--mint),#059669)",
                boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
                marginBottom: 0,
              }}
              onClick={() =>
                capturarYAnalizar(videoRef.current, canvasRef.current)
              }
            >
              📸 Capturar y analizar
            </button>
            <button
              type="button"
              onClick={() => {
                alCerrar();
                abrirModal("report");
              }}
              style={{
                width: "100%",
                background: "white",
                border: "2px solid var(--border)",
                color: "var(--navy)",
                borderRadius: 50,
                padding: "0.7rem",
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 800,
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              📋 Completar formulario de reporte
            </button>
          </div>
        )}

        {resultadoVisible && (
          <div
            style={{
              marginTop: "0.9rem",
              background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)",
              border: "1.5px solid #6EE7B7",
              borderRadius: "var(--radius-sm)",
              padding: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                marginBottom: "0.8rem",
              }}
            >
              {fotoPreview && (
                <img
                  src={fotoPreview}
                  alt="Captura"
                  style={{
                    width: 72,
                    height: 72,
                    objectFit: "cover",
                    borderRadius: 10,
                    border: "2px solid #A7F3D0",
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: "#065F46",
                    marginBottom: 4,
                  }}
                >
                  ✅ Análisis completado
                </div>
                {raza && (
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#047857",
                    }}
                  >
                    {raza}
                  </div>
                )}
                {color && (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#065F46",
                      marginTop: 2,
                    }}
                  >
                    {color}
                  </div>
                )}
                {confianza && (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#047857",
                      marginTop: 2,
                    }}
                  >
                    {confianza}
                  </div>
                )}
              </div>
            </div>
            <div
              style={{
                height: 5,
                background: "#A7F3D0",
                borderRadius: 5,
                overflow: "hidden",
                marginBottom: "0.8rem",
              }}
            >
              <div
                style={{
                  height: 5,
                  background: "var(--mint)",
                  borderRadius: 5,
                  width: `${progresoBarra}%`,
                  transition: "width 1.8s ease",
                }}
              />
            </div>
            <button
              type="button"
              className="submit-btn"
              style={{ fontSize: "0.88rem", padding: "0.7rem", marginBottom: 0 }}
              onClick={() => {
                alCerrar();
                abrirModal("report");
              }}
            >
              🚨 Continuar y reportar pérdida
            </button>
          </div>
        )}
      </div>
    </ModalContenedor>
  );
}
