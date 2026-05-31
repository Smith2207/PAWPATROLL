import type { CanalTiempoReal, EventoTiempoReal } from "@/lib/tiempo-real/tipos";

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
  const canales: CanalTiempoReal[] = ["mapa"];
  if ("mascotaId" in evento && evento.mascotaId) {
    canales.push(`mascota:${evento.mascotaId}`);
  }
  if ("avistamientoId" in evento) {
    canales.push(`avistamiento:${evento.avistamientoId}`);
  }
  if (evento.tipo === "notificacion:nueva") {
    canales.push(`usuario:${evento.userId}`);
  }
  return [...new Set(canales)];
}

export function registrarEmisorWs(
  emit: (canales: CanalTiempoReal[], evento: EventoTiempoReal) => void
) {
  hub().wsEmit = emit;
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
}

export function suscribirCanal(canal: CanalTiempoReal, fn: Suscriptor) {
  const h = hub();
  if (!h.suscriptores.has(canal)) {
    h.suscriptores.set(canal, new Set());
  }
  h.suscriptores.get(canal)!.add(fn);
  return () => {
    h.suscriptores.get(canal)?.delete(fn);
  };
}
