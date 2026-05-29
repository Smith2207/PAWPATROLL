import { estimarRadioConEvidencia } from "@/lib/comportamiento/evidencia-radios";

/**
 * Radio de búsqueda estimado según perfil y evidencia publicada (metros).
 */
export function estimarRadioBusquedaMetros(perfil: {
  tipo?: string | null;
  tamano?: string | null;
  edad?: string | null;
  accesoExterior?: string | null;
  descripcion?: string | null;
  senasParticulares?: string | null;
}): number {
  const { radioBaseMetros, contexto } = estimarRadioConEvidencia(perfil);
  const conductualFactor =
    contexto.esGato && contexto.acceso === "solo_interior" ? 1 : 1;
  return Math.round(radioBaseMetros * conductualFactor);
}
