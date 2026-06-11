/**
 * Utilidades de UI para wizards de reporte.
 */
const CLASE_OCULTA = "pp-wizard-oculto";

/** Muestra el bloque solo cuando el paso activo coincide. */
export function clasePasoWizardVisible(
  pasoActivo: number,
  pasoVisible: number
): string {
  return pasoActivo === pasoVisible ? "" : CLASE_OCULTA;
}

/** Variante con paso opcional (formulario completo si no hay wizard). */
export function clasePasoWizardSeccion(
  pasoActivo: number | undefined,
  seccion: number
): string {
  if (pasoActivo == null) return "";
  return pasoActivo === seccion ? "" : CLASE_OCULTA;
}

/** Oculta el bloque cuando la condición es falsa. */
export function clasePasoWizardCondicional(visible: boolean): string {
  return visible ? "" : CLASE_OCULTA;
}
