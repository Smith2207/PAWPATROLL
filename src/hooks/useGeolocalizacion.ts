"use client";

import { useCallback, useState } from "react";
import { obtenerDireccionDesdeCoords } from "@/lib/geo/geocodificar";
import type { Coordenadas, UbicacionSeleccionada } from "@/lib/geo/tipos";
import { ETIQUETA_MAPA } from "@/lib/geo/etiqueta-ubicacion";
import { CENTRO_MAPA_DEFECTO } from "@/lib/geo/tipos";

type OpcionesUbicacion = {
  onUbicacion?: (ubicacion: UbicacionSeleccionada) => void;
  onDireccionDetectada?: (direccion: string) => void;
};

export type ResultadoUbicacion =
  | { ok: true; ubicacion: UbicacionSeleccionada }
  | { ok: false; error: string };

function leerPosicion(pos: GeolocationPosition): UbicacionSeleccionada {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    precisionMetros: pos.coords.accuracy,
  };
}

export function useGeolocalizacion(opciones: OpcionesUbicacion = {}) {
  const [ubicacion, setUbicacion] = useState<UbicacionSeleccionada | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completarUbicacion = useCallback(
    async (base: UbicacionSeleccionada) => {
      const direccion = await obtenerDireccionDesdeCoords(base.lat, base.lng);
      const etiqueta = direccion ?? "Tu ubicación actual";
      if (direccion) opciones.onDireccionDetectada?.(direccion);

      const completa: UbicacionSeleccionada = { ...base, etiqueta };
      setUbicacion(completa);
      opciones.onUbicacion?.(completa);
      return completa;
    },
    [opciones.onUbicacion, opciones.onDireccionDetectada]
  );

  const solicitarPosicion = useCallback(
    (altaPrecision: boolean): Promise<GeolocationPosition | null> => {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          () => resolve(null),
          {
            enableHighAccuracy: altaPrecision,
            timeout: altaPrecision ? 12_000 : 20_000,
            maximumAge: altaPrecision ? 0 : 60_000,
          }
        );
      });
    },
    []
  );

  const obtenerUbicacion = useCallback(async (): Promise<ResultadoUbicacion> => {
    if (!navigator.geolocation) {
      const msg =
        "Tu navegador no soporta ubicación. Marca el punto en el mapa.";
      setError(msg);
      return { ok: false, error: msg };
    }

    if (!window.isSecureContext) {
      const msg =
        "La ubicación GPS requiere HTTPS (o localhost). Marca el punto en el mapa.";
      setError(msg);
      return { ok: false, error: msg };
    }

    setCargando(true);
    setError(null);

    let pos = await solicitarPosicion(true);
    if (!pos) pos = await solicitarPosicion(false);

    setCargando(false);

    if (!pos) {
      const msg =
        "No pudimos ubicarte. Activa el permiso de ubicación o busca una dirección.";
      setError(msg);
      return { ok: false, error: msg };
    }

    const ubicacion = await completarUbicacion(leerPosicion(pos));
    return { ok: true, ubicacion };
  }, [completarUbicacion, solicitarPosicion]);

  const marcarEnMapa = useCallback(
    async (coords: Coordenadas) => {
      setError(null);
      const direccion = await obtenerDireccionDesdeCoords(coords.lat, coords.lng);
      const ubicacion: UbicacionSeleccionada = {
        ...coords,
        etiqueta: direccion ?? ETIQUETA_MAPA,
      };
      if (direccion) opciones.onDireccionDetectada?.(direccion);
      setUbicacion(ubicacion);
      opciones.onUbicacion?.(ubicacion);
      return ubicacion;
    },
    [opciones.onDireccionDetectada, opciones.onUbicacion]
  );

  const usarMiUbicacion = useCallback(
    async (
      input: HTMLInputElement | null,
      boton: HTMLButtonElement | null
    ) => {
      if (!input || !boton) return;
      const textoInicial = boton.textContent;
      boton.textContent = "Obteniendo...";
      const resultado = await obtenerUbicacion();
      if (resultado.ok) {
        input.value = resultado.ubicacion.etiqueta ?? "Tu ubicación";
        boton.textContent = "Ubicación obtenida";
      } else {
        boton.textContent = textoInicial ?? "Usar mi ubicación GPS";
      }
    },
    [obtenerUbicacion]
  );

  return {
    ubicacion,
    cargando,
    error,
    setError,
    centroDefecto: CENTRO_MAPA_DEFECTO,
    obtenerUbicacion,
    marcarEnMapa,
    usarMiUbicacion,
  };
}
