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
  | {
      tipo: "mensaje:nuevo";
      avistamientoId: string;
      mascotaId: string | null;
      destinatarioUserId?: string;
    }
  | { tipo: "mapa:actualizado" }
  | {
      tipo: "notificacion:nueva";
      userId: string;
      notificacionId: string;
      notifTipo?: string;
      titulo?: string;
      cuerpo?: string;
      enlace?: string;
    }
  | {
      tipo: "chat:escribiendo";
      avistamientoId: string;
      userId: string;
      activo: boolean;
    }
  | {
      tipo: "chat:leido";
      avistamientoId: string;
      userId: string;
      leidoAt: string;
    }
  | { tipo: "caso:actualizado"; mascotaId: string };

export type MensajeClienteWs =
  | { accion: "suscribir"; canales?: CanalTiempoReal[]; token?: string }
  | { accion: "ping" }
  | {
      accion: "presencia";
      tipo: "escribiendo";
      avistamientoId: string;
      userId: string;
      activo?: boolean;
    };

export type MensajeServidorWs = {
  evento: EventoTiempoReal;
  ts: number;
};
