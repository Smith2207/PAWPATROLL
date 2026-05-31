import type { AccesoExterior } from "@/lib/comportamiento/contexto-busqueda";

type OpcionAcceso = { value: AccesoExterior; label: string };

const PERRO: OpcionAcceso[] = [
  { value: "solo_interior", label: "🏠 Solo dentro de casa" },
  { value: "patio_supervisado", label: "🚪 Tiene patio o jardín (supervisado)" },
  { value: "exterior_habitual", label: "🌳 Sale solo a la calle o al barrio" },
];

const GATO: OpcionAcceso[] = [
  { value: "solo_interior", label: "🏠 Gato de interior (no sale)" },
  { value: "patio_supervisado", label: "🚪 Sale al balcón o patio a veces" },
  { value: "exterior_habitual", label: "🌳 Sale solo por el barrio" },
];

const NEUTRO: OpcionAcceso[] = [
  { value: "solo_interior", label: "🏠 Solo interior" },
  { value: "patio_supervisado", label: "🚪 Patio o balcón a veces" },
  { value: "exterior_habitual", label: "🌳 Calle libre con frecuencia" },
];

export function opcionesAccesoExterior(tipo?: string): OpcionAcceso[] {
  const t = (tipo ?? "").toLowerCase();
  if (t.includes("perro")) return PERRO;
  if (t.includes("gato")) return GATO;
  return NEUTRO;
}

export function etiquetaCampoAccesoExterior(tipo?: string): string {
  const t = (tipo ?? "").toLowerCase();
  if (t.includes("gato")) return "¿Tu gato puede salir solo a la calle?";
  if (t.includes("perro")) return "¿Tu perro puede salir solo a la calle?";
  return "¿Tu mascota puede salir sola a la calle?";
}

export function ayudaCampoAccesoExterior(): string {
  return "Nos ayuda a marcar el área de búsqueda en el mapa. Elige la opción más parecida.";
}
