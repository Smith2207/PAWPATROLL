"use client";

import { useCallback, useRef, useState } from "react";
import { obtenerDireccionDesdeCoords } from "@/lib/geo/geocodificar";
import {
  elegirMejorUbicacion,
  obtenerUbicacionViaGoogle,
} from "@/lib/geo/ubicacion-cliente";
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

const PRECISION_IDEAL_M = 30;
const PRECISION_ACEPTABLE_M = 150;
const TIEMPO_ASENTAR_MS = 2_000;
const ESPERA_RAPIDA_MS = 6_000;
const ESPERA_PRECISA_MS = 10_000;

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
      return "Permiso de ubicación denegado. Pulsa Ubicarme en el mapa o toca el mapa para marcar el punto.";
    case 2:
      return "Sin señal GPS clara. Sal al exterior o marca el punto en el mapa.";
    case 3:
      return "No obtuvimos tu ubicación a tiempo. Pulsa Ubicarme en el mapa otra vez, o toca el mapa.";
    default:
      return "No pudimos ubicarte. Pulsa Ubicarme en el mapa o busca una dirección.";
  }
}

/** Muestreos GPS del navegador (en paralelo con Google Maps). */
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
    let temporizadorAsentar: number | null = null;

    const opciones: PositionOptions = {
      enableHighAccuracy,
      maximumAge: enableHighAccuracy ? 15_000 : 120_000,
      timeout: maxEsperaMs,
    };

    const finalizar = () => {
      if (resuelto) return;
      resuelto = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(temporizadorMax);
      if (temporizadorAsentar != null) window.clearTimeout(temporizadorAsentar);
      resolve({ pos: mejor, errorCode: mejor ? undefined : ultimoError });
    };

    const programarAsentado = () => {
      if (temporizadorAsentar != null) return;
      temporizadorAsentar = window.setTimeout(finalizar, TIEMPO_ASENTAR_MS);
    };

    const registrar = (pos: GeolocationPosition) => {
      if (!mejor || pos.coords.accuracy < mejor.coords.accuracy) {
        mejor = pos;
      }
      if (pos.coords.accuracy <= PRECISION_IDEAL_M) {
        finalizar();
        return;
      }
      if (pos.coords.accuracy <= PRECISION_ACEPTABLE_M) {
        programarAsentado();
      }
    };

    const registrarError = (err: GeolocationPositionError) => {
      ultimoError = err.code;
      if (mejor) finalizar();
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

    const temporizadorMax = window.setTimeout(finalizar, maxEsperaMs);
  });
}

async function obtenerPosicionNavegador(): Promise<{
  ubicacion: UbicacionSeleccionada | null;
  errorCode?: number;
}> {
  if (!navigator.geolocation || !window.isSecureContext) {
    return { ubicacion: null };
  }

  let { pos, errorCode } = await esperarMejorPosicion(false, ESPERA_RAPIDA_MS);

  if (!pos || pos.coords.accuracy > PRECISION_ACEPTABLE_M) {
    const precisa = await esperarMejorPosicion(true, ESPERA_PRECISA_MS);
    if (
      precisa.pos &&
      (!pos || precisa.pos.coords.accuracy < pos.coords.accuracy)
    ) {
      pos = precisa.pos;
      errorCode = undefined;
    } else if (!pos) {
      errorCode = precisa.errorCode ?? errorCode;
    }
  }

  return {
    ubicacion: pos ? leerPosicion(pos) : null,
    errorCode,
  };
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
    setCargando(true);
    setError(null);

    let gpsError: number | undefined;
    let ubicacionFinal: UbicacionSeleccionada | null = null;

    const googleP = obtenerUbicacionViaGoogle();
    const gpsP = obtenerPosicionNavegador().then((r) => {
      gpsError = r.errorCode;
      return r.ubicacion;
    });

    const google = await googleP;
    if (google) {
      ubicacionFinal = await completarUbicacion(google);
      setCargando(false);
    }

    const gps = await gpsP;

    if (
      gps &&
      google &&
      (gps.precisionMetros ?? Infinity) < (google.precisionMetros ?? Infinity)
    ) {
      ubicacionFinal = await completarUbicacion(gps);
    }

    setCargando(false);

    if (!ubicacionFinal) {
      const mejor = elegirMejorUbicacion(google, gps);
      if (!mejor) {
        const msg = mensajeErrorGeolocalizacion(gpsError);
        setError(msg);
        return { ok: false, error: msg };
      }
      ubicacionFinal = await completarUbicacion(mejor);
    }

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
