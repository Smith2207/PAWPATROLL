/**
 * Comportamiento predictivo (M5): consejos.
 */
import type { PerfilConductual } from "@/lib/comportamiento/conocimiento";
import type { CercoDinamico, PuntoAvistamientoCerco } from "@/lib/comportamiento/cerco-dinamico";
import { etiquetaAcceso } from "@/lib/comportamiento/contexto-busqueda";
import type { ZonaRefugioProbable } from "@/lib/comportamiento/zonas-refugio";

const MAX_CONSEJOS = 3;

function primeraOracion(texto: string): string {
  const limpia = texto.replace(/\([^)]*\)/g, "").trim();
  const match = limpia.match(/^[^.!?]+[.!?]?/);
  return match?.[0]?.trim() ?? limpia;
}

function lugaresTipicos(conductual: PerfilConductual): string {
  return conductual.refugiosTipicos.slice(0, 2).join(" y ");
}

export function generarConsejosBusqueda(opciones: {
  nombre: string;
  raza?: string | null;
  tamano?: string | null;
  accesoExterior?: string | null;
  conductual: PerfilConductual;
  horasTranscurridas: number;
  diasTranscurridos: number;
  radioActualMetros: number;
  totalAvistamientos: number;
  zonasRefugio: ZonaRefugioProbable[];
  esGato: boolean;
  cerco?: CercoDinamico;
  avistamientos?: PuntoAvistamientoCerco[];
}): string[] {
  const {
    conductual,
    horasTranscurridas,
    diasTranscurridos,
    esGato,
    cerco,
  } = opciones;
  const consejos: string[] = [];
  const lugares = lugaresTipicos(conductual);
  const acceso = etiquetaAcceso(conductual.contexto.acceso).toLowerCase();

  if (cerco && cerco.totalAvistamientos > 0 && cerco.ultimoAvistamiento) {
    const km = (cerco.desplazamientoDesdePerdidaMetros / 1000).toFixed(1);
    const num = cerco.totalAvistamientos;
    if (cerco.desplazamientoDesdePerdidaMetros > 500) {
      consejos.push(
        `Fue visto lejos del punto de pérdida: el mapa se movió ~${km} km hacia el último avistamiento (#${num}). Busca ahí y en ${lugares}.`
      );
    } else {
      consejos.push(
        `Hay ${num} avistamiento(s): concentra la búsqueda en el más reciente y en ${lugares}.`
      );
    }
  } else if (opciones.zonasRefugio.length > 0) {
    const top = opciones.zonasRefugio
      .slice(0, 2)
      .map((z) => z.etiqueta.split("(")[0]?.trim() ?? z.etiqueta)
      .join(" y ");
    consejos.push(
      `Perfil ${conductual.etiqueta.toLowerCase()}: revisa primero ${top}.`
    );
  } else {
    const km = (opciones.radioActualMetros / 1000).toFixed(1);
    consejos.push(
      `Aún sin avistamientos: recorre el cerco de ~${km} km del mapa, sobre todo ${lugares}.`
    );
  }

  const comportamiento = primeraOracion(conductual.tendencia);
  if (comportamiento) {
    consejos.push(
      `${comportamiento.charAt(0).toUpperCase()}${comportamiento.slice(1)}`
    );
  }

  if (consejos.length < MAX_CONSEJOS) {
    if (horasTranscurridas < 48) {
      consejos.push(
        `En las primeras horas, busca sobre todo ${conductual.horarioActivo.toLowerCase()} (${acceso}).`
      );
    } else if (esGato && diasTranscurridos < 7) {
      consejos.push(
        `Lleva ${diasTranscurridos} días: amplía la búsqueda cada día y deja comida en el punto de pérdida.`
      );
    } else if (!esGato && opciones.totalAvistamientos === 0 && diasTranscurridos >= 2) {
      consejos.push(
        `Sin avistamientos aún: deja ropa con tu olor donde se perdió y reparte volantes en el vecindario.`
      );
    } else if (diasTranscurridos >= 7) {
      consejos.push(
        `Lleva más de una semana: avisa veterinarias y revisa refugios fijos en ${lugares}.`
      );
    }
  }

  return consejos.slice(0, MAX_CONSEJOS);
}

export function idsFuentesRelevantes(esGato: boolean): string[] {
  if (esGato) {
    return ["huang-2018-gatos", "lord-2007-perros-gatos", "mar-gatos"];
  }
  return ["lord-2007-perros-gatos", "lord-2009-perros", "albrecht-2015"];
}

export function rasgosUnicosMascota(perfil: {
  tipo?: string | null;
  raza?: string | null;
  tamano?: string | null;
  accesoExterior?: string | null;
  edad?: string | null;
}): string[] {
  const rasgos: string[] = [];
  if (perfil.raza?.trim()) rasgos.push(perfil.raza.trim());
  else if (perfil.tipo?.trim()) rasgos.push(perfil.tipo.trim());
  if (perfil.tamano?.trim()) rasgos.push(perfil.tamano.trim());
  if (perfil.edad?.trim()) rasgos.push(perfil.edad.trim());

  const acceso = perfil.accesoExterior?.trim();
  if (acceso === "solo_interior") rasgos.push("Solo interior");
  else if (acceso === "patio_supervisado") rasgos.push("Patio supervisado");
  else if (acceso === "exterior_habitual") rasgos.push("Sale al exterior");

  return rasgos.slice(0, 4);
}
