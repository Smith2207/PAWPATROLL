"use client";

import { useEffect, useRef } from "react";
import { Icono } from "@/componentes/ui/Icono";
import { useCamaraReporte } from "@/hooks/useCamaraReporte";
import { ACCEPT_INPUT_IMAGEN } from "@/lib/imagen/validar-archivo";

const MAX_BYTES_AVISTAMIENTO = 4 * 1024 * 1024;

type Props = {
  foto: string | null;
  onChange: (dataUrl: string | null) => void;
};

export function SubirFotoAvistamiento({ foto, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { fotosPreview, previewFotos, limpiarFotos, errorArchivo } =
    useCamaraReporte({
      idPrefijo: "avistamiento",
      maxFotos: 1,
      maxBytesArchivo: MAX_BYTES_AVISTAMIENTO,
    });

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
          accept={ACCEPT_INPUT_IMAGEN}
          style={{ display: "none" }}
          onChange={(e) => previewFotos(e.target)}
        />
        <div className="photo-upload-icon">
          <Icono nombre="imagen" size={28} />
        </div>
        <div className="photo-upload-text">Elegir de galería</div>
      </div>

      {errorArchivo && (
        <p className="auth-alerta auth-alerta--error" role="alert">
          {errorArchivo}
        </p>
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
