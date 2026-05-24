const RAZAS_PERRO = [
  "Mestizo",
  "Labrador Retriever",
  "Golden Retriever",
  "Pastor Alemán",
  "Bulldog Francés",
  "Poodle",
  "Chihuahua",
  "Yorkshire Terrier",
  "Schnauzer",
  "Husky Siberiano",
  "Beagle",
  "Pitbull",
  "Dachshund (Salchicha)",
  "Rottweiler",
  "Boxer",
  "Pug",
  "Shih Tzu",
  "Doberman",
  "Cocker Spaniel",
  "Border Collie",
] as const;

const RAZAS_GATO = [
  "Mestizo",
  "Siamés",
  "Persa",
  "Maine Coon",
  "Bengalí",
  "British Shorthair",
  "Angora",
  "Ragdoll",
  "Sphynx",
  "Abisinio",
  "Bombay",
  "Scottish Fold",
] as const;

export const OPCION_RAZA_OTRA = "Otro";

const RAZAS_POR_TIPO: Record<string, readonly string[]> = {
  Perro: RAZAS_PERRO,
  Gato: RAZAS_GATO,
};

export function obtenerRazasPorTipo(tipo: string): string[] {
  if (!tipo) return [];
  const razas = RAZAS_POR_TIPO[tipo];
  if (!razas) return [];
  return [...razas, OPCION_RAZA_OTRA];
}

function listaRazasConocidas(tipo: string): string[] {
  return [...(RAZAS_POR_TIPO[tipo] ?? [])];
}

export function parsearRaza(tipo: string, raza: string | null | undefined) {
  const lista = listaRazasConocidas(tipo);
  const valor = raza?.trim() ?? "";

  if (!valor) return { seleccion: "", otra: "" };
  if (lista.includes(valor)) return { seleccion: valor, otra: "" };
  return { seleccion: OPCION_RAZA_OTRA, otra: valor };
}

export function componerRaza(seleccion: string, otra: string): string {
  if (!seleccion) return "";
  if (seleccion === OPCION_RAZA_OTRA) return otra.trim();
  return seleccion;
}
