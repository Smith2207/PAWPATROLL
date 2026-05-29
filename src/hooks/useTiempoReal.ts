"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CanalTiempoReal, EventoTiempoReal } from "@/lib/tiempo-real/tipos";
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

export function useTiempoReal(
  canales: CanalTiempoReal[],
  onEvento: (evento: EventoTiempoReal) => void
) {
  const [conectado, setConectado] = useState(false);
  const onEventoRef = useRef(onEvento);
  onEventoRef.current = onEvento;
  const canalesKey = canales.join("|");

  const reconectar = useCallback(() => {
    const url = urlWebSocket();
    if (!url || canales.length === 0) return () => undefined;

    let ws: WebSocket | null = null;
    let cerrado = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const conectar = () => {
      if (cerrado) return;
      ws = new WebSocket(url);

      ws.onopen = () => {
        setConectado(true);
        ws?.send(
          JSON.stringify({
            accion: "suscribir",
            canales,
          })
        );
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
      setConectado(false);
    };
  }, [canalesKey]);

  useEffect(() => reconectar(), [reconectar]);

  return { conectado };
}
