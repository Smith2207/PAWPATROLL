/** Filtros del mapa público (M4). */

export type FiltrosMapaPublico = {
  tipoMascota?: "" | "Perro" | "Gato";
  /** Últimos N días; 0 = sin límite */
  dias?: number;
  estadoAvistamiento?: "" | "PENDIENTE" | "VERIFICADO";
};

export const OPCIONES_DIAS_MAPA = [
  { valor: 0, etiqueta: "Todo el historial" },
  { valor: 1, etiqueta: "Últimas 24 h" },
  { valor: 7, etiqueta: "Últimos 7 días" },
  { valor: 30, etiqueta: "Últimos 30 días" },
] as const;
