"use client";



/**
 * Hook React: geolocalizacion.
 */
import { useCallback, useEffect, useRef, useState } from "react";
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

const PRECISION_IDEAL_M = 40;
const PRECISION_ACEPTABLE_M = 250;
const TIEMPO_ASENTAR_MS = 800;
const ESPERA_CACHE_MS = 3_000;
const ESPERA_GPS_MS = 12_000;
const MAX_EDAD_CACHE_MS = 120_000;

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
      return "Permiso de ubicación denegado. Activa el GPS en el navegador o marca el punto en el mapa.";
    case 2:
      return "No hay señal GPS. En el celular activa la ubicación; en PC prueba cerca de una ventana o marca en el mapa.";
    case 3:
      return "El GPS tardó demasiado. Intenta de nuevo al aire libre o marca el punto en el mapa.";
    default:
      return "No obtuvimos tu posición por GPS. Marca el punto en el mapa o escribe la dirección.";
  }
}

/** Última lectura GPS del navegador (solo alta precisión, sin ubicación por red/IP). */
function lecturaGpsCacheada(): Promise<UbicacionSeleccionada | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation || !window.isSecureContext) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(leerPosicion(pos)),
      () => resolve(null),
      {
        enableHighAccuracy: true,
        maximumAge: MAX_EDAD_CACHE_MS,
        timeout: ESPERA_CACHE_MS,
      }
    );
  });
}

function esperarMejorPosicion(
  maxEsperaMs: number,
  onProvisional?: (ubicacion: UbicacionSeleccionada) => void
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
      enableHighAccuracy: true,
      maximumAge: 0,
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

      if (onProvisional) {
        onProvisional(leerPosicion(pos));
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

async function obtenerPosicionGps(
  onProvisional?: (ubicacion: UbicacionSeleccionada) => void
): Promise<{
  ubicacion: UbicacionSeleccionada | null;
  errorCode?: number;
}> {
  if (!navigator.geolocation || !window.isSecureContext) {
    return { ubicacion: null };
  }

  const cache = await lecturaGpsCacheada();
  if (cache && (cache.precisionMetros ?? Infinity) <= PRECISION_ACEPTABLE_M) {
    onProvisional?.(cache);
    return { ubicacion: cache };
  }

  const { pos, errorCode } = await esperarMejorPosicion(
    ESPERA_GPS_MS,
    onProvisional
  );

  if (pos) {
    return { ubicacion: leerPosicion(pos) };
  }

  if (cache) {
    return { ubicacion: cache, errorCode };
  }

  return { ubicacion: null, errorCode };
}

function etiquetaProvisional(base: UbicacionSeleccionada): string {
  const aviso = textoPrecisionGps(base.precisionMetros);
  if (aviso) return aviso;
  return ETIQUETA_GPS;
}

function esMasPrecisa(
  a: UbicacionSeleccionada,
  b: UbicacionSeleccionada
): boolean {
  return (a.precisionMetros ?? Infinity) < (b.precisionMetros ?? Infinity);
}

export function useGeolocalizacion(opciones: OpcionesUbicacion = {}) {
  const [ubicacion, setUbicacion] = useState<UbicacionSeleccionada | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onUbicacionRef = useRef(opciones.onUbicacion);
  const onDireccionRef = useRef(opciones.onDireccionDetectada);
  useEffect(() => {
    onUbicacionRef.current = opciones.onUbicacion;
    onDireccionRef.current = opciones.onDireccionDetectada;
  }, [opciones.onUbicacion, opciones.onDireccionDetectada]);

  const publicarUbicacion = useCallback((u: UbicacionSeleccionada) => {
    setUbicacion(u);
    onUbicacionRef.current?.(u);
  }, []);

  const enriquecerConDireccion = useCallback(
    async (base: UbicacionSeleccionada) => {
      const direccion = await obtenerDireccionDesdeCoords(
        base.lat,
        base.lng,
        base.precisionMetros
      );

      const avisoPrecision = textoPrecisionGps(base.precisionMetros);
      let etiqueta = direccion ?? base.etiqueta ?? ETIQUETA_GPS;
      if (avisoPrecision && direccion) {
        etiqueta = `${direccion} · ±${Math.round(base.precisionMetros ?? 0)} m`;
      } else if (avisoPrecision) {
        etiqueta = avisoPrecision;
      }

      if (direccion) onDireccionRef.current?.(direccion);

      const completa: UbicacionSeleccionada = { ...base, etiqueta };
      publicarUbicacion(completa);
      return completa;
    },
    [publicarUbicacion]
  );

  const publicarRapido = useCallback(
    (base: UbicacionSeleccionada) => {
      const rapida: UbicacionSeleccionada = {
        ...base,
        etiqueta: base.etiqueta ?? etiquetaProvisional(base),
      };
      publicarUbicacion(rapida);
      return rapida;
    },
    [publicarUbicacion]
  );

  const obtenerUbicacion = useCallback(async (): Promise<ResultadoUbicacion> => {
    setCargando(true);
    setError(null);

    let mejor: UbicacionSeleccionada | null = null;

    const onProvisional = (u: UbicacionSeleccionada) => {
      if (!mejor || esMasPrecisa(u, mejor)) {
        mejor = u;
        publicarRapido(u);
        setCargando(false);
      }
    };

    const { ubicacion: gps, errorCode } = await obtenerPosicionGps(onProvisional);

    setCargando(false);

    if (gps) {
      if (!mejor || esMasPrecisa(gps, mejor)) {
        mejor = gps;
        publicarRapido(gps);
      }
      const final = await enriquecerConDireccion(mejor);
      return { ok: true, ubicacion: final };
    }

    const msg = mensajeErrorGeolocalizacion(errorCode);
    setError(msg);
    return { ok: false, error: msg };
  }, [enriquecerConDireccion, publicarRapido]);

  const marcarEnMapa = useCallback(
    async (coords: Coordenadas) => {
      setError(null);
      const base: UbicacionSeleccionada = {
        ...coords,
        etiqueta: "Punto marcado en el mapa",
        precisionMetros: 5,
      };
      publicarRapido(base);
      return enriquecerConDireccion(base);
    },
    [enriquecerConDireccion, publicarRapido]
  );

  const usarMiUbicacion = useCallback(
    async (
      input: HTMLInputElement | null,
      boton: HTMLButtonElement | null
    ) => {
      if (!input || !boton) return;
      const textoInicial = boton.textContent;
      boton.textContent = "Obteniendo GPS...";
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
