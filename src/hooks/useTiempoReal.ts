"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CanalTiempoReal,
  EventoTiempoReal,
  MensajeClienteWs,
} from "@/lib/tiempo-real/tipos";
import { webSocketDisponibleEnCliente } from "@/lib/tiempo-real/ws-disponible";

function urlWebSocket() {
  if (typeof window === "undefined") return null;
  if (!webSocketDisponibleEnCliente()) return null;
  const env = process.env.NEXT_PUBLIC_WS_URL;
  if (env) return env;
  const host = window.location.hostname;
  const puerto = process.env.NEXT_PUBLIC_WS_PORT ?? "3001";
  const protocolo = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocolo}://${host}:${puerto}`;
}

function requiereTokenAuth(canales: CanalTiempoReal[]) {
  return canales.some((c) => c !== "mapa");
}

/** Clave estable (sin duplicados, orden fijo). */
function claveCanales(canales: CanalTiempoReal[]): string {
  if (canales.length === 0) return "";
  return [...new Set(canales)].sort().join("\0");
}

/** Caché compartida entre instancias del hook (evita 429 al reconectar). */
let tokenWsCache: { token: string; expira: number } | null = null;
let tokenWsPendiente: Promise<string | null> | null = null;

async function obtenerTokenWs(): Promise<string | null> {
  const ahora = Date.now();
  if (tokenWsCache && tokenWsCache.expira > ahora) {
    return tokenWsCache.token;
  }

  if (tokenWsPendiente) return tokenWsPendiente;

  tokenWsPendiente = (async () => {
    try {
      const res = await fetch("/api/ws/token", { credentials: "same-origin" });
      if (res.status === 429) {
        return tokenWsCache?.token ?? null;
      }
      if (!res.ok) return null;
      const data = (await res.json()) as { ok?: boolean; token?: string };
      if (!data.ok || !data.token) return null;
      tokenWsCache = { token: data.token, expira: Date.now() + 4 * 60_000 };
      return data.token;
    } catch {
      return tokenWsCache?.token ?? null;
    } finally {
      tokenWsPendiente = null;
    }
  })();

  return tokenWsPendiente;
}

export function useTiempoReal(
  canales: CanalTiempoReal[],
  onEvento: (evento: EventoTiempoReal) => void
) {
  const [conectado, setConectado] = useState(false);
  const conectadoRef = useRef(false);
  const onEventoRef = useRef(onEvento);
  const wsRef = useRef<WebSocket | null>(null);
  const canalesRef = useRef(canales);

  onEventoRef.current = onEvento;
  canalesRef.current = canales;

  const canalesKey = claveCanales(canales);

  useEffect(() => {
    const url = urlWebSocket();

    const marcarConectado = (valor: boolean) => {
      if (conectadoRef.current === valor) return;
      conectadoRef.current = valor;
      setConectado(valor);
    };

    if (!url || !canalesKey) {
      marcarConectado(false);
      return undefined;
    }

    let ws: WebSocket | null = null;
    let cerrado = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const conectar = () => {
      if (cerrado) return;

      const canalesActuales = canalesRef.current;
      if (canalesActuales.length === 0) return;

      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        void (async () => {
          if (cerrado || ws?.readyState !== WebSocket.OPEN) return;

          if (requiereTokenAuth(canalesActuales)) {
            const token = await obtenerTokenWs();
            if (cerrado || ws?.readyState !== WebSocket.OPEN) return;
            if (token) {
              ws.send(JSON.stringify({ accion: "suscribir", token }));
            } else {
              ws.send(
                JSON.stringify({ accion: "suscribir", canales: ["mapa"] })
              );
            }
          } else {
            ws.send(
              JSON.stringify({ accion: "suscribir", canales: ["mapa"] })
            );
          }
          marcarConectado(true);
        })();
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(String(ev.data)) as {
            evento?: EventoTiempoReal;
          };
          if (data.evento) onEventoRef.current(data.evento);
        } catch {
          /* ignorar */
        }
      };

      ws.onclose = () => {
        if (wsRef.current === ws) wsRef.current = null;
        marcarConectado(false);
        if (!cerrado) {
          timer = setTimeout(conectar, 3000);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    conectar();

    return () => {
      cerrado = true;
      if (timer) clearTimeout(timer);
      ws?.close();
      if (wsRef.current === ws) wsRef.current = null;
      marcarConectado(false);
    };
  }, [canalesKey]);

  const enviar = useCallback((mensaje: MensajeClienteWs) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(mensaje));
  }, []);

  return { conectado, enviar };
}
