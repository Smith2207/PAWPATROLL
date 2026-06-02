/** PawPatrol solo registra perros y gatos. */
export const TIPOS_MASCOTA = ["Perro", "Gato"] as const;

export type TipoMascota = (typeof TIPOS_MASCOTA)[number];

export function esTipoMascotaPermitido(tipo: string): tipo is TipoMascota {
  return (TIPOS_MASCOTA as readonly string[]).includes(tipo);
}

/** Texto corto en marcadores del mapa cuando no hay foto (no emoji). */
export const FALLBACK_MARCADOR_TIPO: Record<TipoMascota, string> = {
  Perro: "P",
  Gato: "G",
};

export function fallbackMarcadorPorTipo(tipo: string): string {
  return esTipoMascotaPermitido(tipo) ? FALLBACK_MARCADOR_TIPO[tipo] : "•";
}

export const OPCIONES_TIPO = [
  { value: "Perro", label: "Perro" },
  { value: "Gato", label: "Gato" },
] as const;

/** @deprecated Usar iconoPorTipoMascota en UI o fallbackMarcadorPorTipo en mapa */
export function emojiPorTipo(tipo: string): string {
  return fallbackMarcadorPorTipo(tipo);
}

/** @deprecated Usar OPCIONES_TIPO */
export const OPCIONES_TIPO_CON_EMOJI = OPCIONES_TIPO;
