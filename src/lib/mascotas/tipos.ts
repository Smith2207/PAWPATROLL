/** PawPatroll solo registra perros y gatos. */
export const TIPOS_MASCOTA = ["Perro", "Gato"] as const;

export type TipoMascota = (typeof TIPOS_MASCOTA)[number];

export function esTipoMascotaPermitido(tipo: string): tipo is TipoMascota {
  return (TIPOS_MASCOTA as readonly string[]).includes(tipo);
}

/** Devuelve el tipo si es válido (Perro/Gato); si no, cadena vacía. */
export function tipoMascotaDesdeTexto(valor?: string | null): string {
  const t = valor?.trim();
  return t && esTipoMascotaPermitido(t) ? t : "";
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
