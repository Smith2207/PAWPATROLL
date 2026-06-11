"use client";



/**
 * Hook React: tiempo real con respaldo.
 */
/**
 * Hook React: tiempo real con respaldo.
 */
import { useRespaldoActualizacion } from "@/hooks/useRespaldoActualizacion";
import { useTiempoReal } from "@/hooks/useTiempoReal";
import type { CanalTiempoReal, EventoTiempoReal } from "@/lib/tiempo-real/tipos";

/** WebSocket en tiempo real + polling cuando no hay conexión (p. ej. Vercel). */
export function useTiempoRealConRespaldo(
  canales: CanalTiempoReal[],
  onEvento: (evento: EventoTiempoReal) => void,
  onRespaldo: () => void,
  intervaloRespaldoMs = 90_000
) {
  const resultado = useTiempoReal(canales, onEvento);
  useRespaldoActualizacion(
    onRespaldo,
    resultado.conectado,
    intervaloRespaldoMs
  );
  return resultado;
}
