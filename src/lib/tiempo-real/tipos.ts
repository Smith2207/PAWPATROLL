export type CanalTiempoReal =
  | `mascota:${string}`
  | "mapa"
  | `avistamiento:${string}`
  | `usuario:${string}`;

export type EventoTiempoReal =
  | {
      tipo: "avistamiento:nuevo";
      mascotaId: string | null;
      avistamientoId: string;
    }
  | {
      tipo: "avistamiento:actualizado";
      mascotaId: string | null;
      avistamientoId: string;
    }
  | { tipo: "mensaje:nuevo"; avistamientoId: string; mascotaId: string | null }
  | { tipo: "mapa:actualizado" }
  | { tipo: "notificacion:nueva"; userId: string; notificacionId: string }
  | { tipo: "caso:actualizado"; mascotaId: string };

export type MensajeClienteWs =
  | { accion: "suscribir"; canales: CanalTiempoReal[] }
  | { accion: "ping" };

export type MensajeServidorWs = {
  evento: EventoTiempoReal;
  ts: number;
};
