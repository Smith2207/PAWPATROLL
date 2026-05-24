import {
  etiquetaUbicacionPeru,
  formatearNombreUbicacion,
  normalizarTextoBusqueda,
} from "@/lib/geo/formatear-ubicacion";

const UBIGEO_JSON_URL = "https://free.e-api.net.pe/ubigeos.json";

export type UbicacionPeru = {
  departamento: string;
  provincia: string;
  distrito: string;
  ubigeo: string;
  etiqueta: string;
};

type NodoDistrito = {
  ubigeo?: string;
  inei?: string;
};

type ArbolUbigeo = Record<string, Record<string, Record<string, NodoDistrito>>>;

type IndiceUbigeo = {
  cargadoEn: number;
  ubicaciones: UbicacionPeru[];
};

const globalForUbigeo = globalThis as typeof globalThis & {
  __ubigeoPeruIndice?: IndiceUbigeo;
};

function construirIndice(arbol: ArbolUbigeo): UbicacionPeru[] {
  const lista: UbicacionPeru[] = [];

  for (const [depRaw, provincias] of Object.entries(arbol)) {
    const departamento = formatearNombreUbicacion(depRaw);
    for (const [provRaw, distritos] of Object.entries(provincias)) {
      const provincia = formatearNombreUbicacion(provRaw);
      for (const [distRaw, nodo] of Object.entries(distritos)) {
        const distrito = formatearNombreUbicacion(distRaw);
        lista.push({
          departamento,
          provincia,
          distrito,
          ubigeo: nodo.ubigeo ?? nodo.inei ?? "",
          etiqueta: etiquetaUbicacionPeru(depRaw, provRaw, distRaw),
        });
      }
    }
  }

  return lista;
}

async function cargarIndice(): Promise<UbicacionPeru[]> {
  const existente = globalForUbigeo.__ubigeoPeruIndice;
  const unaHora = 60 * 60 * 1000;
  if (existente && Date.now() - existente.cargadoEn < unaHora) {
    return existente.ubicaciones;
  }

  const respuesta = await fetch(UBIGEO_JSON_URL, {
    next: { revalidate: 86400 },
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar el catálogo de ubigeos del Perú.");
  }

  const arbol = (await respuesta.json()) as ArbolUbigeo;
  const ubicaciones = construirIndice(arbol);

  globalForUbigeo.__ubigeoPeruIndice = {
    cargadoEn: Date.now(),
    ubicaciones,
  };

  return ubicaciones;
}

export async function buscarUbicacionesPeru(
  termino: string,
  limite = 12
): Promise<UbicacionPeru[]> {
  const t = normalizarTextoBusqueda(termino);
  if (t.length < 2) return [];

  const indice = await cargarIndice();
  const coincidencias: { u: UbicacionPeru; prioridad: number }[] = [];

  for (const u of indice) {
    const nd = normalizarTextoBusqueda(u.distrito);
    const np = normalizarTextoBusqueda(u.provincia);
    const ndep = normalizarTextoBusqueda(u.departamento);
    const etiqueta = normalizarTextoBusqueda(u.etiqueta);

    if (nd.startsWith(t)) {
      coincidencias.push({ u, prioridad: 0 });
    } else if (np.startsWith(t)) {
      coincidencias.push({ u, prioridad: 1 });
    } else if (ndep.startsWith(t)) {
      coincidencias.push({ u, prioridad: 2 });
    } else if (etiqueta.includes(t)) {
      coincidencias.push({ u, prioridad: 3 });
    }
  }

  coincidencias.sort((a, b) => {
    if (a.prioridad !== b.prioridad) return a.prioridad - b.prioridad;
    return a.u.etiqueta.localeCompare(b.u.etiqueta, "es");
  });

  const vistas = new Set<string>();
  const resultados: UbicacionPeru[] = [];

  for (const { u } of coincidencias) {
    if (vistas.has(u.etiqueta)) continue;
    vistas.add(u.etiqueta);
    resultados.push(u);
    if (resultados.length >= limite) break;
  }

  return resultados;
}
