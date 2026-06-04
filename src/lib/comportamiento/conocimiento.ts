/** Perfil conductual (M5) calibrado con literatura de mascotas perdidas. */

import {
  resolverContextoBusqueda,
  etiquetaAcceso,
  type ContextoBusqueda,
} from "@/lib/comportamiento/contexto-busqueda";
import { EVIDENCIA } from "@/lib/comportamiento/fuentes";

export type PerfilConductual = {
  etiqueta: string;
  radioBaseFactor: number;
  expansionDiaria: number;
  distanciaRefugioMetros: number;
  horarioActivo: string;
  tendencia: string;
  refugiosTipicos: string[];
  contexto: ContextoBusqueda;
};

function normalizar(texto: string | null | undefined) {
  return (texto ?? "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function tamanoCategoria(tamano: string | null | undefined): "pequeño" | "mediano" | "grande" {
  const t = normalizar(tamano);
  if (t.includes("peque") || t.includes("menos de 10")) return "pequeño";
  if (t.includes("grande") || t.includes("mas de 25") || t.includes("más de 25"))
    return "grande";
  return "mediano";
}

const PERROS: Record<string, Partial<PerfilConductual>> = {
  labrador: {
    etiqueta: "Perro sociable y explorador",
    expansionDiaria: 0.38,
    distanciaRefugioMetros: 420,
    tendencia:
      "Suele seguir olores y personas; prioriza parques y zonas con actividad (Lord et al.: búsqueda en vecindario).",
    refugiosTipicos: ["parques", "áreas con basureros", "entrada de comercios"],
  },
  pastor: {
    etiqueta: "Perro activo con alto radio de exploración",
    expansionDiaria: 0.44,
    distanciaRefugioMetros: 550,
    tendencia:
      "Puede recorrer senderos y espacios abiertos; reparte volantes en un perímetro amplio.",
    refugiosTipicos: ["campos", "estacionamientos", "zonas verdes"],
  },
  chihuahua: {
    etiqueta: "Perro pequeño, asustadizo",
    expansionDiaria: 0.18,
    distanciaRefugioMetros: 180,
    tendencia:
      "Suele esconderse cerca del escape; revisa rincones bajos en un radio corto.",
    refugiosTipicos: ["debajo de autos", "macetas", "garajes"],
  },
  bulldog: {
    etiqueta: "Perro de baja resistencia al caminar",
    expansionDiaria: 0.2,
    distanciaRefugioMetros: 220,
    tendencia:
      "No suele alejarse mucho; prioriza sombra y lugares frescos en las primeras cuadras.",
    refugiosTipicos: ["sótanos", "patios", "cocheras"],
  },
};

const POR_TAMANO: Record<
  "pequeño" | "mediano" | "grande",
  Pick<PerfilConductual, "radioBaseFactor" | "expansionDiaria" | "distanciaRefugioMetros">
> = {
  pequeño: {
    radioBaseFactor: 0.9,
    expansionDiaria: 0.22,
    distanciaRefugioMetros: 220,
  },
  mediano: {
    radioBaseFactor: 1,
    expansionDiaria: 0.32,
    distanciaRefugioMetros: 350,
  },
  grande: {
    radioBaseFactor: 1.15,
    expansionDiaria: 0.4,
    distanciaRefugioMetros: 480,
  },
};

function perfilGato(contexto: ContextoBusqueda, tam: "pequeño" | "mediano" | "grande"): PerfilConductual {
  const ajusteTam = POR_TAMANO[tam];
  const accesoTxt = etiquetaAcceso(contexto.acceso);

  if (contexto.acceso === "solo_interior") {
    return {
      ...ajusteTam,
      etiqueta: "Gato de interior asustado",
      radioBaseFactor: 0.85,
      expansionDiaria: 0.08,
      distanciaRefugioMetros: Math.min(ajusteTam.distanciaRefugioMetros, 150),
      horarioActivo: "Madrugada y anochecer (cuando hay menos ruido)",
      tendencia: `Estudios indican que muchos gatos de interior se ocultan a ~${EVIDENCIA.GATO_INTERIOR_MEDIANA_M} m del escape; busca debajo de porches, autos y en la casa vecina.`,
      refugiosTipicos: [
        "debajo de autos",
        "porches y decks",
        "sótanos de edificios",
        "matorrales densos",
      ],
      contexto,
    };
  }

  if (contexto.acceso === "patio_supervisado") {
    return {
      ...ajusteTam,
      etiqueta: "Gato con patio — territorial cauteloso",
      radioBaseFactor: 0.95,
      expansionDiaria: 0.15,
      distanciaRefugioMetros: 200,
      horarioActivo: "Crepúsculo y madrugada",
      tendencia:
        "Puede estar oculto en un radio de pocas cuadras; revisa patios contiguos y techos bajos.",
      refugiosTipicos: [
        "patios vecinos",
        "estacionamientos",
        "techos bajos",
        "matorrales",
      ],
      contexto,
    };
  }

  return {
    ...ajusteTam,
    etiqueta: "Gato con acceso al exterior",
    radioBaseFactor: 1,
    expansionDiaria: 0.22,
    distanciaRefugioMetros: 280,
    horarioActivo: "Crepúsculo y madrugada",
    tendencia: `Hasta ~75% de gatos perdidos se hallan dentro de ${EVIDENCIA.GATO_MIXTO_RADIO_P75_M} m; búsqueda física en la primera semana es clave.`,
    refugiosTipicos: [
      "estacionamientos",
      "zonas con matorral",
      "sótanos",
      "casas de vecinos (gatos curiosos)",
    ],
    contexto,
  };
}

const DEFECTO_PERRO: Omit<PerfilConductual, "contexto"> = {
  etiqueta: "Perro — perfil estándar",
  radioBaseFactor: 1,
  expansionDiaria: 0.32,
  distanciaRefugioMetros: 340,
  horarioActivo: "Mañana temprano y tarde",
  tendencia:
    "Prioriza búsqueda a pie en espiral desde el último punto visto; muchos perros regresan solos o son avistados en el vecindario.",
  refugiosTipicos: ["parques", "zonas verdes", "cocheras", "callejones"],
};

export function obtenerPerfilConductual(perfil: {
  tipo?: string | null;
  raza?: string | null;
  tamano?: string | null;
  edad?: string | null;
  accesoExterior?: string | null;
  descripcion?: string | null;
  senasParticulares?: string | null;
}): PerfilConductual {
  const contexto = resolverContextoBusqueda(perfil);
  const raza = normalizar(perfil.raza);
  const tam = tamanoCategoria(perfil.tamano);

  if (contexto.esGato) {
    let base = perfilGato(contexto, tam);
    if (raza.includes("siames")) {
      base = {
        ...base,
        etiqueta: "Gato vocal y curioso",
        expansionDiaria: base.expansionDiaria + 0.04,
        tendencia:
          "Puede acercarse a viviendas; escucha maullidos al amanecer. Sigue siendo probable que esté oculto muy cerca.",
      };
    }
    if (contexto.accesoInferido) {
      base = {
        ...base,
        tendencia: `${base.tendencia} (Acceso estimado: ${etiquetaAcceso(contexto.acceso).toLowerCase()} — indícalo en los datos de la mascota para afinar el cerco.)`,
      };
    }
    return base;
  }

  let base: PerfilConductual = { ...DEFECTO_PERRO, ...POR_TAMANO[tam], contexto };
  for (const [clave, datos] of Object.entries(PERROS)) {
    if (raza.includes(clave)) {
      base = { ...base, ...datos, contexto };
      break;
    }
  }

  const edad = normalizar(perfil.edad);
  if (edad.includes("cachorro") || edad.includes("joven")) {
    base = {
      ...base,
      expansionDiaria: base.expansionDiaria + 0.06,
      tendencia: `${base.tendencia} Los jóvenes pueden recorrer más por curiosidad.`,
    };
  }
  if (edad.includes("senior") || edad.includes("mayor")) {
    base = {
      ...base,
      expansionDiaria: Math.max(0.12, base.expansionDiaria - 0.1),
      distanciaRefugioMetros: base.distanciaRefugioMetros * 0.8,
      tendencia: `${base.tendencia} Los adultos mayores suelen quedarse más cerca.`,
    };
  }

  if (contexto.acceso === "solo_interior") {
    base = {
      ...base,
      expansionDiaria: Math.min(base.expansionDiaria, 0.14),
      distanciaRefugioMetros: base.distanciaRefugioMetros * 0.7,
      tendencia: `${base.tendencia} Perro de interior: prioriza garajes, pasillos y patios vecinos.`,
    };
  }

  return base;
}
