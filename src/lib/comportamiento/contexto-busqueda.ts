import { EVIDENCIA } from "@/lib/comportamiento/fuentes";

export type AccesoExterior =
  | "solo_interior"
  | "patio_supervisado"
  | "exterior_habitual";

export type ContextoBusqueda = {
  esGato: boolean;
  acceso: AccesoExterior;
  /** Si el acceso se infirió del texto y no del formulario */
  accesoInferido: boolean;
};

const VALORES_ACCESO: AccesoExterior[] = [
  "solo_interior",
  "patio_supervisado",
  "exterior_habitual",
];

function normalizar(texto: string | null | undefined): string {
  return (texto ?? "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

export function parsearAccesoExterior(
  valor: string | null | undefined
): AccesoExterior | null {
  if (!valor) return null;
  const v = valor.trim() as AccesoExterior;
  return VALORES_ACCESO.includes(v) ? v : null;
}

/** Infiere acceso desde descripción, señas o edad cuando no hay campo explícito. */
export function inferirAccesoExterior(perfil: {
  tipo?: string | null;
  descripcion?: string | null;
  senasParticulares?: string | null;
  edad?: string | null;
}): AccesoExterior {
  const texto = normalizar(
    [perfil.descripcion, perfil.senasParticulares, perfil.edad].join(" ")
  );
  const esGato = normalizar(perfil.tipo).includes("gato");

  if (
    /solo interior|nunca sale|no sale|indoor only|de departamento|de casa sin patio/.test(
      texto
    )
  ) {
    return "solo_interior";
  }
  if (
    /sale al patio|patio|balcon|balcón|terraza|jardin pequeño|jardín pequeño|supervisad/.test(
      texto
    )
  ) {
    return "patio_supervisado";
  }
  if (
    /callejero|vive afuera|sale solo|sale sola|acceso libre|exterior|de la calle|gato de barrio/.test(
      texto
    )
  ) {
    return "exterior_habitual";
  }

  if (esGato) {
    return "patio_supervisado";
  }
  return "exterior_habitual";
}

export function resolverContextoBusqueda(perfil: {
  tipo?: string | null;
  accesoExterior?: string | null;
  descripcion?: string | null;
  senasParticulares?: string | null;
  edad?: string | null;
}): ContextoBusqueda {
  const esGato = normalizar(perfil.tipo).includes("gato");
  const explicito = parsearAccesoExterior(perfil.accesoExterior);
  if (explicito) {
    return { esGato, acceso: explicito, accesoInferido: false };
  }
  return {
    esGato,
    acceso: inferirAccesoExterior(perfil),
    accesoInferido: true,
  };
}

export function etiquetaAcceso(acceso: AccesoExterior): string {
  switch (acceso) {
    case "solo_interior":
      return "Solo interior (no sale al exterior)";
    case "patio_supervisado":
      return "Sale al patio o balcón supervisado";
    case "exterior_habitual":
      return "Suele salir al exterior con libertad";
  }
}

export function radioBaseEvidencia(
  contexto: ContextoBusqueda,
  tamano: string | null | undefined
): { metros: number; nota: string; fuenteId: string } {
  const tam = normalizar(tamano);

  if (contexto.esGato) {
    switch (contexto.acceso) {
      case "solo_interior":
        return {
          metros: EVIDENCIA.GATO_INTERIOR_P75_M,
          nota: "Basado en mediana ~137 m para gatos de interior (estudio con 1.210 casos).",
          fuenteId: "huang-2018-gatos",
        };
      case "patio_supervisado":
        return {
          metros: Math.round(EVIDENCIA.GATO_MIXTO_RADIO_P75_M * 0.65),
          nota: "Entre gato de interior y con acceso exterior (~75% hallados dentro de 500 m).",
          fuenteId: "huang-2018-gatos",
        };
      case "exterior_habitual":
        return {
          metros: EVIDENCIA.GATO_MIXTO_RADIO_P75_M,
          nota: "75% de gatos perdidos se encontraron dentro de 500 m del escape.",
          fuenteId: "huang-2018-gatos",
        };
    }
  }

  let base: number = EVIDENCIA.PERRO_MEDIANO_BASE_M;
  if (tam.includes("peque")) base = EVIDENCIA.PERRO_PEQUEÑO_BASE_M;
  else if (tam.includes("grande") || tam.includes("más de 25"))
    base = EVIDENCIA.PERRO_GRANDE_BASE_M;

  if (contexto.acceso === "solo_interior") {
    return {
      metros: Math.round(base * EVIDENCIA.PERRO_INTERIOR_FACTOR),
      nota: "Perro de interior: radio reducido según hallazgos de búsqueda en vecindario cercano.",
      fuenteId: "lord-2007-perros-gatos",
    };
  }
  if (contexto.acceso === "patio_supervisado") {
    return {
      metros: Math.round(base * 0.75),
      nota: "Perro con patio: prioriza perímetro cercano antes de ampliar.",
      fuenteId: "lord-2007-perros-gatos",
    };
  }
  return {
    metros: base,
    nota: "Perro con salida habitual: radio según tamaño y expansión por tiempo.",
    fuenteId: "lord-2007-perros-gatos",
  };
}
