/**
 * PawPatrol — servicio WebSocket (solo este paquete se despliega en Railway).
 * Vercel hace POST /publish; los navegadores se conectan por wss://
 */
import http from "node:http";
import { WebSocketServer } from "ws";
import { verificarTokenSuscripcionWs } from "./verificar-token-ws.mjs";
import { canalesParaEvento } from "./lib/canales-para-evento.mjs";

const PORT = Number(process.env.PORT ?? 3001);
const SECRET = process.env.WS_PUBLISH_SECRET?.trim() ?? "";

/** @type {import('ws').WebSocket & { canales?: Set<string> }[]} */
const clientes = new Set();

function emitir(canales, evento) {
  const payload = JSON.stringify({ evento, ts: Date.now() });
  for (const ws of clientes) {
    if (ws.readyState !== 1 || !ws.canales) continue;
    const coincide = canales.some((c) => ws.canales.has(c));
    if (coincide) ws.send(payload);
  }
}

function parsearCanales(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (c) =>
      typeof c === "string" &&
      (c === "mapa" ||
        c.startsWith("mascota:") ||
        c.startsWith("avistamiento:") ||
        c.startsWith("usuario:"))
  );
}

const servidor = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/publish") {
    if (!SECRET) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "WS_PUBLISH_SECRET no configurado" }));
      return;
    }
    const auth = req.headers.authorization ?? "";
    if (auth !== `Bearer ${SECRET}`) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "No autorizado" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 32_000) req.destroy();
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const evento = data?.evento;
        if (!evento?.tipo) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: "evento inválido" }));
          return;
        }
        const canales = canalesParaEvento(evento);
        emitir(canales, evento);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, canales }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "JSON inválido" }));
      }
    });
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, servicio: "pawpatroll-ws", clientes: clientes.size }));
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: servidor });

wss.on("connection", (socket) => {
  socket.canales = new Set(["mapa"]);
  clientes.add(socket);

  socket.on("message", (data) => {
    try {
      const msg = JSON.parse(String(data));
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
          socket.canales = new Set(parsearCanales(payload.canales));
        } else if (SECRET) {
          socket.canales = new Set(["mapa"]);
        } else {
          socket.canales = new Set(parsearCanales(msg.canales));
        }
        if (socket.canales.size === 0) socket.canales.add("mapa");
        return;
      }
      if (
        msg.accion === "presencia" &&
        msg.tipo === "escribiendo" &&
        msg.avistamientoId &&
        msg.userId
      ) {
        const canal = `avistamiento:${msg.avistamientoId}`;
        const evento = {
          tipo: "chat:escribiendo",
          avistamientoId: msg.avistamientoId,
          userId: msg.userId,
          activo: msg.activo !== false,
        };
        const payload = JSON.stringify({ evento, ts: Date.now() });
        for (const ws of clientes) {
          if (ws === socket) continue;
          if (ws.readyState !== 1 || !ws.canales?.has(canal)) continue;
          ws.send(payload);
        }
      }
    } catch {
      /* ignorar */
    }
  });

  socket.on("close", () => clientes.delete(socket));
});

servidor.listen(PORT, "0.0.0.0", () => {
  console.log(`[pawpatroll-ws] Puerto ${PORT}`);
  console.log(`[pawpatroll-ws] WebSocket: wss://<tu-dominio>`);
  console.log(`[pawpatroll-ws] Publish: POST https://<tu-dominio>/publish`);
});
