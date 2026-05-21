"use client";

import { useGeolocalizacion } from "@/hooks/useGeolocalizacion";
import { useRef } from "react";

type Props = {
  etiqueta: string;
  idInput: string;
  icono: string;
  placeholder: string;
  pinMapa: string;
  textoMapa: string;
};

export function SelectorUbicacionMapa({
  etiqueta,
  idInput,
  icono,
  placeholder,
  pinMapa,
  textoMapa,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const { usarMiUbicacion } = useGeolocalizacion();

  return (
    <div className="form-group">
      <label>{etiqueta}</label>
      <div className="location-picker">
        <div className="location-picker-top">
          <span className="loc-icon">{icono}</span>
          <input
            ref={inputRef}
            id={idInput}
            type="text"
            placeholder={placeholder}
          />
        </div>
        <div className="location-map-preview">
          <div className="map-preview-grid" />
          <div
            className="map-preview-road-h"
            style={{ top: "40%", left: 0, width: "100%" }}
          />
          <div
            className="map-preview-road-h"
            style={{ top: "70%", left: "5%", width: "80%" }}
          />
          <div
            className="map-preview-road-v"
            style={{ left: "30%", top: 0, height: "100%" }}
          />
          <div
            className="map-preview-road-v"
            style={{ left: "65%", top: "5%", height: "90%" }}
          />
          <div className="map-preview-pin">{pinMapa}</div>
          <button
            ref={botonRef}
            type="button"
            className="use-location-btn"
            onClick={() => usarMiUbicacion(inputRef.current, botonRef.current)}
          >
            🎯 Usar mi ubicación GPS
          </button>
          <div className="map-preview-label">
            <div className="map-preview-badge">{textoMapa}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
