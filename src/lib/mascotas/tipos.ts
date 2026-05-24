/** PawPatrol solo registra perros y gatos. */
export const TIPOS_MASCOTA = ["Perro", "Gato"] as const;

export type TipoMascota = (typeof TIPOS_MASCOTA)[number];

export function esTipoMascotaPermitido(tipo: string): tipo is TipoMascota {
  return (TIPOS_MASCOTA as readonly string[]).includes(tipo);
}

export const EMOJI_POR_TIPO: Record<TipoMascota, string> = {
  Perro: "🐕",
  Gato: "🐱",
};

export function emojiPorTipo(tipo: string): string {
  return esTipoMascotaPermitido(tipo) ? EMOJI_POR_TIPO[tipo] : "";
}

export const OPCIONES_TIPO_CON_EMOJI = [
  { value: "Perro", label: "🐕 Perro" },
  { value: "Gato", label: "🐱 Gato" },
] as const;
