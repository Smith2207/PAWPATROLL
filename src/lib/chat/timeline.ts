import type { EventoCaso, EventoCasoTipo, MensajeAvistamiento } from "@/lib/db/schema";

export type ItemTimelineChat =
  | { tipo: "mensaje"; data: MensajeAvistamiento; fecha: Date }
  | { tipo: "evento"; data: EventoCasoTimeline; fecha: Date };

export type EventoCasoTimeline = {
  id: string;
  tipo: EventoCasoTipo;
  titulo: string;
  detalle: string | null;
  createdAt: Date;
};

const EVENTOS_EN_CHAT: EventoCasoTipo[] = [
  "ALERTA_ACTIVADA",
  "AVISTAMIENTO_NUEVO",
  "FOTO_AGREGADA",
  "COINCIDENCIA_IA",
  "AVISTAMIENTO_VERIFICADO",
  "AVISTAMIENTO_DESCARTADO",
  "ESTADO_CAMBIADO",
  "MASCOTA_RECUPERADA",
];

export function eventoVisibleEnChat(tipo: EventoCasoTipo): boolean {
  return EVENTOS_EN_CHAT.includes(tipo);
}

import type { NombreIcono } from "@/componentes/ui/Icono";

export function nombreIconoEventoTimeline(tipo: EventoCasoTipo): NombreIcono {
  switch (tipo) {
    case "AVISTAMIENTO_NUEVO":
      return "ubicacion";
    case "COINCIDENCIA_IA":
      return "cerebro";
    case "FOTO_AGREGADA":
      return "camara";
    case "ALERTA_ACTIVADA":
    case "ESTADO_CAMBIADO":
      return "alerta";
    case "MASCOTA_RECUPERADA":
      return "checkCirculo";
    case "AVISTAMIENTO_VERIFICADO":
      return "check";
    case "AVISTAMIENTO_DESCARTADO":
      return "xCirculo";
    default:
      return "info";
  }
}

export function tituloEventoTimeline(ev: EventoCasoTimeline): string {
  switch (ev.tipo) {
    case "AVISTAMIENTO_NUEVO":
      return "Nuevo avistamiento registrado";
    case "COINCIDENCIA_IA":
      return "IA detectó coincidencia";
    case "FOTO_AGREGADA":
      return "Nueva fotografía agregada";
    case "ALERTA_ACTIVADA":
      return "Caso de búsqueda activado";
    case "MASCOTA_RECUPERADA":
      return "Mascota encontrada";
    case "AVISTAMIENTO_VERIFICADO":
      return "Avistamiento verificado";
    case "AVISTAMIENTO_DESCARTADO":
      return "Avistamiento descartado";
    case "ESTADO_CAMBIADO":
      return ev.titulo || "Estado del caso actualizado";
    default:
      return ev.titulo;
  }
}

export function combinarTimelineChat(
  mensajes: MensajeAvistamiento[],
  eventos: EventoCasoTimeline[]
): ItemTimelineChat[] {
  const items: ItemTimelineChat[] = [
    ...mensajes.map((m) => ({
      tipo: "mensaje" as const,
      data: m,
      fecha: new Date(m.createdAt),
    })),
    ...eventos
      .filter((e) => eventoVisibleEnChat(e.tipo))
      .map((e) => ({
        tipo: "evento" as const,
        data: e,
        fecha: new Date(e.createdAt),
      })),
  ];
  return items.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}
