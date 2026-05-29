"use client";

import { useEffect } from "react";

/** Actualiza datos cada N ms cuando el WebSocket no está conectado (p. ej. en Vercel). */
export function useRespaldoActualizacion(
  onActualizar: () => void,
  conectadoWs: boolean,
  intervaloMs = 90_000
) {
  useEffect(() => {
    if (conectadoWs) return;
    const id = window.setInterval(() => onActualizar(), intervaloMs);
    return () => window.clearInterval(id);
  }, [conectadoWs, onActualizar, intervaloMs]);
}
