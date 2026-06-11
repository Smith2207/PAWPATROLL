/**
 * Pasos de los wizards de reporte (pérdida y avistamiento).
 */
export type PasoWizard = { id: number; titulo: string };

export const PASOS_WIZARD_PERDIDA = [
  { id: 1, titulo: "Lo esencial" },
  { id: 2, titulo: "Detalles" },
  { id: 3, titulo: "Contacto" },
] as const;

export const PASOS_WIZARD_AVISTAMIENTO = [
  { id: 1, titulo: "Foto" },
  { id: 2, titulo: "Lugar" },
  { id: 3, titulo: "Publicar" },
] as const;

export const PASOS_WIZARD_AVISTAMIENTO_FICHA = [
  { id: 1, titulo: "Dónde la viste" },
  { id: 2, titulo: "Publicar" },
] as const;
