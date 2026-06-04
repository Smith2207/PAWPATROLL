"use client";

import { useCallback, useRef, useState } from "react";
import { obtenerDireccionDesdeCoords } from "@/lib/geo/geocodificar";
import type { Coordenadas, UbicacionSeleccionada } from "@/lib/geo/tipos";
import { CENTRO_MAPA_DEFECTO } from "@/lib/geo/tipos";
import { ETIQUETA_GPS } from "@/lib/geo/etiqueta-ubicacion";
import { textoPrecisionGps } from "@/lib/geo/precision-gps";

type OpcionesUbicacion = {
  onUbicacion?: (ubicacion: UbicacionSeleccionada) => void;
  onDireccionDetectada?: (direccion: string) => void;
};

export type ResultadoUbicacion =
  | { ok: true; ubicacion: UbicacionSeleccionada }
  | { ok: false; error: string };

const META_PRECISION_METROS = 20;
const ESPERA_GPS_ALTA_MS = 18_000;
const ESPERA_GPS_BAJA_MS = 12_000;

function leerPosicion(pos: GeolocationPosition): UbicacionSeleccionada {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    precisionMetros: pos.coords.accuracy,
  };
}

function mensajeErrorGeolocalizacion(code: number | undefined): string {
  switch (code) {
    case 1:
      return "Activa el permiso de ubicación en el navegador o marca el punto en el mapa.";
    case 2:
      return "Sin señal GPS clara. Sal al exterior, activa Wi‑Fi y vuelve a intentar, o marca en el mapa.";
    case 3:
      return "La ubicación tardó demasiado. Intenta otra vez o toca el mapa para fijar el punto.";
    default:
      return "No pudimos ubicarte. Activa el permiso de ubicación o busca una dirección.";
  }
}

/** Varios muestreos GPS y se queda con la lectura más precisa. */
function esperarMejorPosicion(
  enableHighAccuracy: boolean,
  maxEsperaMs: number
): Promise<{ pos: GeolocationPosition | null; errorCode?: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ pos: null });
      return;
    }

    let mejor: GeolocationPosition | null = null;
    let ultimoError: number | undefined;
    let watchId: number | null = null;
    let resuelto = false;

    const opciones: PositionOptions = {
      enableHighAccuracy,
      maximumAge: 0,
      timeout: maxEsperaMs,
    };

    const finalizar = () => {
      if (resuelto) return;
      resuelto = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(temporizador);
      resolve({ pos: mejor, errorCode: mejor ? undefined : ultimoError });
    };

    const registrar = (pos: GeolocationPosition) => {
      if (!mejor || pos.coords.accuracy < mejor.coords.accuracy) {
        mejor = pos;
      }
      if (pos.coords.accuracy <= META_PRECISION_METROS) {
        finalizar();
      }
    };

    const registrarError = (err: GeolocationPositionError) => {
      ultimoError = err.code;
    };

    watchId = navigator.geolocation.watchPosition(
      registrar,
      registrarError,
      opciones
    );

    navigator.geolocation.getCurrentPosition(
      registrar,
      registrarError,
      opciones
    );

    const temporizador = window.setTimeout(finalizar, maxEsperaMs);
  });
}

function etiquetaProvisional(base: UbicacionSeleccionada): string {
  const aviso = textoPrecisionGps(base.precisionMetros);
  if (aviso) return aviso;
  return ETIQUETA_GPS;
}

export function useGeolocalizacion(opciones: OpcionesUbicacion = {}) {
  const [ubicacion, setUbicacion] = useState<UbicacionSeleccionada | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onUbicacionRef = useRef(opciones.onUbicacion);
  const onDireccionRef = useRef(opciones.onDireccionDetectada);
  onUbicacionRef.current = opciones.onUbicacion;
  onDireccionRef.current = opciones.onDireccionDetectada;

  const publicarUbicacion = useCallback((u: UbicacionSeleccionada) => {
    setUbicacion(u);
    onUbicacionRef.current?.(u);
  }, []);

  const completarUbicacion = useCallback(async (base: UbicacionSeleccionada) => {
    const provisional: UbicacionSeleccionada = {
      ...base,
      etiqueta: etiquetaProvisional(base),
    };
    publicarUbicacion(provisional);

    const direccion = await obtenerDireccionDesdeCoords(
      base.lat,
      base.lng,
      base.precisionMetros
    );

    const avisoPrecision = textoPrecisionGps(base.precisionMetros);
    let etiqueta = direccion ?? ETIQUETA_GPS;
    if (avisoPrecision && direccion) {
      etiqueta = `${direccion} · ±${Math.round(base.precisionMetros ?? 0)} m`;
    } else if (avisoPrecision) {
      etiqueta = avisoPrecision;
    }

    if (direccion) onDireccionRef.current?.(direccion);

    const completa: UbicacionSeleccionada = { ...base, etiqueta };
    publicarUbicacion(completa);
    return completa;
  }, [publicarUbicacion]);

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

    let { pos, errorCode } = await esperarMejorPosicion(
      true,
      ESPERA_GPS_ALTA_MS
    );

    if (!pos || pos.coords.accuracy > 80) {
      const respaldo = await esperarMejorPosicion(false, ESPERA_GPS_BAJA_MS);
      if (
        respaldo.pos &&
        (!pos || respaldo.pos.coords.accuracy < pos.coords.accuracy)
      ) {
        pos = respaldo.pos;
        errorCode = undefined;
      } else if (!pos) {
        errorCode = respaldo.errorCode ?? errorCode;
      }
    }

    setCargando(false);

    if (!pos) {
      try {
        const res = await fetch("/api/geo/ubicacion", { method: "POST" });
        const data = (await res.json()) as {
          ok?: boolean;
          lat?: number;
          lng?: number;
          precisionMetros?: number;
        };
        if (
          data.ok &&
          Number.isFinite(data.lat) &&
          Number.isFinite(data.lng)
        ) {
          const ubicacionFinal = await completarUbicacion({
            lat: data.lat!,
            lng: data.lng!,
            precisionMetros: data.precisionMetros ?? 500,
          });
          return { ok: true, ubicacion: ubicacionFinal };
        }
      } catch {
        /* sin Google Maps configurado */
      }

      const msg = mensajeErrorGeolocalizacion(errorCode);
      setError(msg);
      return { ok: false, error: msg };
    }

    const ubicacionFinal = await completarUbicacion(leerPosicion(pos));
    return { ok: true, ubicacion: ubicacionFinal };
  }, [completarUbicacion]);

  const marcarEnMapa = useCallback(async (coords: Coordenadas) => {
    setError(null);
    const direccion = await obtenerDireccionDesdeCoords(coords.lat, coords.lng);
    const ubicacion: UbicacionSeleccionada = {
      ...coords,
      etiqueta: direccion ?? "Punto marcado en el mapa",
      precisionMetros: 5,
    };
    if (direccion) onDireccionRef.current?.(direccion);
    publicarUbicacion(ubicacion);
    return ubicacion;
  }, [publicarUbicacion]);

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
        input.value = resultado.ubicacion.etiqueta ?? ETIQUETA_GPS;
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
