/**
 * Tiempo real (WebSocket / hub): servidor-ws.
 */
import { WebSocketServer, type WebSocket } from "ws";
import type { CanalTiempoReal, MensajeClienteWs, MensajeServidorWs } from "@/lib/tiempo-real/tipos";
import { registrarEmisorWs } from "@/lib/tiempo-real/hub";
import { verificarTokenSuscripcionWs } from "@/lib/tiempo-real/token-ws";

type ClienteWs = WebSocket & { canales?: Set<CanalTiempoReal> };

const globalWs = globalThis as typeof globalThis & {
  __ppWsIniciado?: boolean;
};

const SECRET_WS =
  process.env.WS_PUBLISH_SECRET?.trim() ||
  process.env.AUTH_SECRET?.trim() ||
  "";
function parsearCanales(raw: unknown): CanalTiempoReal[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (c): c is CanalTiempoReal =>
      typeof c === "string" &&
      (c === "mapa" ||
        c.startsWith("mascota:") ||
        c.startsWith("avistamiento:") ||
        c.startsWith("usuario:"))
  );
}

export function iniciarServidorWebSocket() {
  if (globalWs.__ppWsIniciado) return;
  globalWs.__ppWsIniciado = true;

  const puerto = Number(process.env.WS_PORT ?? 3001);
  const wss = new WebSocketServer({ port: puerto, host: "0.0.0.0" });

  registrarEmisorWs((canales, evento) => {
    const payload: MensajeServidorWs = { evento, ts: Date.now() };
    const texto = JSON.stringify(payload);

    wss.clients.forEach((cliente) => {
      const c = cliente as ClienteWs;
      if (c.readyState !== 1 || !c.canales) return;
      const coincide = canales.some((canal) => c.canales!.has(canal));
      if (coincide) c.send(texto);
    });
  });

  wss.on("connection", (socket) => {
    const cliente = socket as ClienteWs;
    cliente.canales = new Set(["mapa"]);

    socket.on("message", (data) => {
      try {
        const msg = JSON.parse(String(data)) as MensajeClienteWs;
        if (msg.accion === "ping") {
          socket.send(JSON.stringify({ pong: true }));
          return;
        }
        if (msg.accion === "suscribir") {
          if (msg.token) {
            const payload = verificarTokenSuscripcionWs(msg.token);
            if (!payload) {
              socket.close(4001, "token inválido");
              return;
            }
            cliente.canales = new Set(parsearCanales(payload.canales));
          } else if (SECRET_WS) {
            cliente.canales = new Set(["mapa"]);
          } else {
            cliente.canales = new Set(parsearCanales(msg.canales));
          }
          if (cliente.canales.size === 0) cliente.canales.add("mapa");
          return;
        }        if (
          msg.accion === "presencia" &&
          msg.tipo === "escribiendo" &&
          msg.avistamientoId &&
          msg.userId
        ) {
          const canal = `avistamiento:${msg.avistamientoId}` as CanalTiempoReal;
          const evento = {
            tipo: "chat:escribiendo" as const,
            avistamientoId: msg.avistamientoId,
            userId: msg.userId,
            activo: msg.activo !== false,
          };
          const payload: MensajeServidorWs = { evento, ts: Date.now() };
          const texto = JSON.stringify(payload);
          wss.clients.forEach((otro) => {
            if (otro === socket) return;
            const c = otro as ClienteWs;
            if (c.readyState !== 1 || !c.canales?.has(canal)) return;
            c.send(texto);
          });
        }
      } catch {
        /* ignorar mensajes mal formados */
      }
    });
  });

  console.log(`[PawPatrol] WebSocket en ws://localhost:${puerto}`);
}
