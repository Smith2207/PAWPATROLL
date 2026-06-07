import type { CanalTiempoReal, EventoTiempoReal } from "@/lib/tiempo-real/tipos";
import { canalesParaEvento as canalesParaEventoCompartido } from "@/services/pawpatroll-ws/lib/canales-para-evento.mjs";

type Suscriptor = (evento: EventoTiempoReal) => void;

const globalHub = globalThis as typeof globalThis & {
  __ppHubTiempoReal?: {
    suscriptores: Map<CanalTiempoReal, Set<Suscriptor>>;
    wsEmit?: (canales: CanalTiempoReal[], evento: EventoTiempoReal) => void;
  };
};

function hub() {
  if (!globalHub.__ppHubTiempoReal) {
    globalHub.__ppHubTiempoReal = { suscriptores: new Map() };
  }
  return globalHub.__ppHubTiempoReal;
}

export function canalesParaEvento(evento: EventoTiempoReal): CanalTiempoReal[] {
  return canalesParaEventoCompartido(
    evento as Record<string, unknown> & { tipo: string }
  ) as CanalTiempoReal[];
}

export function registrarEmisorWs(
  emit: (canales: CanalTiempoReal[], evento: EventoTiempoReal) => void
) {
  hub().wsEmit = emit;
}

function publicarEnServidorWsRemoto(evento: EventoTiempoReal) {
  const url = process.env.WS_PUBLISH_URL?.trim();
  const secret = process.env.WS_PUBLISH_SECRET?.trim();
  if (!url || !secret) return;

  void fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ evento }),
  }).catch((err) => {
    if (process.env.NODE_ENV === "development") {
      console.warn("[PawPatrol] WS publish falló:", err);
    }
  });
}

export function emitirTiempoReal(evento: EventoTiempoReal) {
  const canales = canalesParaEvento(evento);
  const h = hub();

  for (const canal of canales) {
    const set = h.suscriptores.get(canal);
    if (set) {
      for (const fn of set) fn(evento);
    }
  }

  h.wsEmit?.(canales, evento);

  /** Vercel/serverless: el WS vive en otro proceso (Railway, etc.). */
  if (!h.wsEmit) {
    publicarEnServidorWsRemoto(evento);
  }
}
