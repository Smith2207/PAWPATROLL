import type { AccesoExterior } from "@/lib/comportamiento/contexto-busqueda";

type OpcionAcceso = { value: AccesoExterior; label: string };

const PERRO: OpcionAcceso[] = [
  { value: "solo_interior", label: "Solo dentro de casa" },
  { value: "patio_supervisado", label: "Tiene patio o jardín (supervisado)" },
  { value: "exterior_habitual", label: "Sale solo a la calle o al barrio" },
];

const GATO: OpcionAcceso[] = [
  { value: "solo_interior", label: "Gato de interior (no sale)" },
  { value: "patio_supervisado", label: "Sale al balcón o patio a veces" },
  { value: "exterior_habitual", label: "Sale solo por el barrio" },
];

const NEUTRO: OpcionAcceso[] = [
  { value: "solo_interior", label: "Solo dentro de casa" },
  { value: "patio_supervisado", label: "Patio o balcón a veces" },
  { value: "exterior_habitual", label: "Sale solo afuera con frecuencia" },
];

export function opcionesAccesoExterior(tipo?: string): OpcionAcceso[] {
  const t = (tipo ?? "").toLowerCase();
  if (t.includes("perro")) return PERRO;
  if (t.includes("gato")) return GATO;
  return NEUTRO;
}

export function etiquetaCampoAccesoExterior(tipo?: string): string {
  const t = (tipo ?? "").toLowerCase();
  if (t.includes("gato")) return "¿Tu gato sale de casa?";
  if (t.includes("perro")) return "¿Tu perro sale de casa?";
  return "¿Suele salir de casa?";
}

export function ayudaCampoAccesoExterior(): string {
  return "Elige la opción más parecida. Nos ayuda a marcar el área de búsqueda en el mapa; no tiene que ser exacta.";
}
