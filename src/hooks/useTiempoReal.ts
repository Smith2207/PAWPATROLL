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

async function obtenerTokenWs(): Promise<string | null> {
  try {
    const res = await fetch("/api/ws/token", { credentials: "same-origin" });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; token?: string };
    return data.ok && data.token ? data.token : null;
  } catch {
    return null;
  }
}

export function useTiempoReal(
  canales: CanalTiempoReal[],
  onEvento: (evento: EventoTiempoReal) => void
) {
  const [conectado, setConectado] = useState(false);
  const onEventoRef = useRef(onEvento);
  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    onEventoRef.current = onEvento;
  });
  const canalesRef = useRef(canales);
  useEffect(() => {
    canalesRef.current = canales;
  }, [canales]);

  const enviar = useCallback((mensaje: MensajeClienteWs) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(mensaje));
  }, []);

  const reconectar = useCallback(() => {
    const url = urlWebSocket();
    const canalesActuales = canalesRef.current;
    if (!url || canalesActuales.length === 0) return () => undefined;

    let ws: WebSocket | null = null;
    let cerrado = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const conectar = () => {
      if (cerrado) return;
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        void (async () => {
          if (requiereTokenAuth(canalesActuales)) {
            const token = await obtenerTokenWs();
            if (token) {
              ws?.send(JSON.stringify({ accion: "suscribir", token }));
            } else {
              ws?.send(
                JSON.stringify({ accion: "suscribir", canales: ["mapa"] })
              );
            }
          } else {
            ws?.send(
              JSON.stringify({ accion: "suscribir", canales: ["mapa"] })
            );
          }
          setConectado(true);
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
        wsRef.current = null;
        setConectado(false);
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
      wsRef.current = null;
      setConectado(false);
    };
  }, []);

  useEffect(() => reconectar(), [reconectar, canales]);

  return { conectado, enviar };
}
