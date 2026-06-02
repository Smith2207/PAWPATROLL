"use client";

import { useEffect, useRef } from "react";
import { Icono } from "@/componentes/ui/Icono";
import { useCamaraReporte } from "@/hooks/useCamaraReporte";

type Props = {
  foto: string | null;
  onChange: (dataUrl: string | null) => void;
};

export function SubirFotoAvistamiento({ foto, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    fotosPreview,
    camaraVisible,
    previewFotos,
    abrirCamara,
    capturarFoto,
    cerrarCamara,
    limpiarFotos,
    ids,
  } = useCamaraReporte({ idPrefijo: "avistamiento", maxFotos: 1 });

  useEffect(() => {
    if (fotosPreview[0] && fotosPreview[0] !== foto) {
      onChange(fotosPreview[0]);
    }
  }, [fotosPreview, foto, onChange]);

  const preview = foto;

  return (
    <div className="form-group">
      <label>Foto que viste en la calle (opcional)</label>
      <p className="form-ficha-ayuda" style={{ marginTop: 0 }}>
        Se adjunta al reporte como evidencia para el dueño.
      </p>

      <div className="pp-foto-avistamiento-grid">
        <div
          className="photo-upload"
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={(e) => previewFotos(e.target)}
          />
          <div className="photo-upload-icon">
            <Icono nombre="imagen" size={28} />
          </div>
          <div className="photo-upload-text">Subir imagen</div>
        </div>

        <div
          className="photo-upload pp-foto-avistamiento-camara"
          role="button"
          tabIndex={0}
          onClick={() => void abrirCamara()}
          onKeyDown={(e) => e.key === "Enter" && void abrirCamara()}
        >
          <div className="photo-upload-icon">
            <Icono nombre="camara" size={28} />
          </div>
          <div className="photo-upload-text">Tomar foto</div>
        </div>
      </div>

      {camaraVisible && (
        <div className="pp-camara-avistamiento">
          <video id={ids.video} autoPlay playsInline className="pp-camara-video" />
          <canvas id={ids.canvas} style={{ display: "none" }} />
          <div className="pp-camara-acciones">
            <button type="button" onClick={capturarFoto}>
              <Icono nombre="camara" size={16} className="pp-icon--btn" /> Capturar
            </button>
            <button type="button" onClick={cerrarCamara}>
              <Icono nombre="cerrar" size={16} />
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="pp-foto-avistamiento-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Vista previa del avistamiento" />
          <button
            type="button"
            onClick={() => {
              limpiarFotos();
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            Quitar foto
          </button>
        </div>
      )}
    </div>
  );
}
