import type { PerfilConductual } from "@/lib/comportamiento/conocimiento";
import type { CercoDinamico, PuntoAvistamientoCerco } from "@/lib/comportamiento/cerco-dinamico";
import { etiquetaAcceso } from "@/lib/comportamiento/contexto-busqueda";
import { EVIDENCIA } from "@/lib/comportamiento/fuentes";
import { distanciaMetros } from "@/lib/geo/distancia";
import type { ZonaRefugioProbable } from "@/lib/comportamiento/zonas-refugio";

export function generarConsejosBusqueda(opciones: {
  nombre: string;
  conductual: PerfilConductual;
  horasTranscurridas: number;
  diasTranscurridos: number;
  radioActualMetros: number;
  radioTemporalMetros?: number;
  totalAvistamientos: number;
  zonasRefugio: ZonaRefugioProbable[];
  esGato: boolean;
  cerco?: CercoDinamico;
  avistamientos?: PuntoAvistamientoCerco[];
}): string[] {
  const consejos: string[] = [];
  const { nombre, conductual, horasTranscurridas, diasTranscurridos } = opciones;
  const { contexto } = conductual;

  consejos.push(
    `Prioriza ~${(opciones.radioActualMetros / 1000).toFixed(1)} km desde el último punto visto (${conductual.etiqueta}).`
  );
  consejos.push(
    `Contexto: ${etiquetaAcceso(contexto.acceso)}.`
  );

  if (opciones.esGato) {
    if (contexto.acceso === "solo_interior") {
      consejos.push(
        `Gato de interior: estudios con más de 1.000 casos muestran que muchos se hallan a ~${EVIDENCIA.GATO_INTERIOR_MEDIANA_M} m; revisa tu casa, la vecina y debajo de autos antes de alejarte.`
      );
      consejos.push(
        "Busca al amanecer con linterna; no asumas que “salió lejos” — suelen estar ocultos cerca (MAR / Missing Animal Response).",
      );
    } else {
      consejos.push(
        `Gato con salida: ~75% se encuentran dentro de ${EVIDENCIA.GATO_MIXTO_RADIO_P75_M} m; búsqueda física en la primera semana es lo más efectivo.`,
      );
    }
    if (diasTranscurridos >= 3 && horasTranscurridas < 24 * EVIDENCIA.DIAS_BAJA_PROBABILIDAD_GATO) {
      consejos.push(
        "Tras varios días sin avistamientos, amplía refugios fijos y avisa veterinarias; la probabilidad de hallazgo vivo cae con el tiempo.",
      );
    }
  } else {
    consejos.push(
      "Perro: reparte volantes en el vecindario y deja comida + ropa con tu olor en el punto de pérdida; muchos regresan solos o son vistos cerca.",
    );
    if (contexto.acceso === "solo_interior") {
      consejos.push(
        "Perro de interior: prioriza garajes, pasillos y patios vecinos antes de ampliar a kilómetros.",
      );
    }
  }

  if (horasTranscurridas < 6) {
    consejos.push(
      `Primeras horas críticas: reparte volantes y revisa ${nombre} a pie en círculos de 150–350 m (más corto si es gato de interior).`,
    );
  } else if (diasTranscurridos < 2) {
    consejos.push(
      "Amplía la búsqueda cada 12 h; deja comida y ropa con tu olor en el punto de pérdida.",
    );
  } else if (diasTranscurridos < 7) {
    consejos.push(
      `En la primera semana se recupera una parte importante de mascotas reportadas (gatos: ~${EVIDENCIA.GATO_RECUPERADO_7_DIAS_PCT}% por el dueño en 7 días en estudios de cuestionario).`,
    );
  } else {
    consejos.push(
      "Tras varios días, revisa refugios fijos y avisa a veterinarias y albergues de la zona.",
    );
  }

  consejos.push(`Horario más activo estimado: ${conductual.horarioActivo}.`);
  consejos.push(conductual.tendencia);

  if (opciones.cerco && opciones.cerco.totalAvistamientos > 0) {
    const { cerco } = opciones;
    const km = (cerco.radioMetros / 1000).toFixed(1);
    if (cerco.tendencia === "ampliado") {
      consejos.push(
        `Hay ${cerco.totalAvistamientos} avistamiento(s): el cerco se amplió a ~${km} km (${cerco.motivoAjuste})`,
      );
    } else if (cerco.tendencia === "contraido") {
      consejos.push(
        `Hay ${cerco.totalAvistamientos} avistamiento(s): el cerco se enfocó en ~${km} km (${cerco.motivoAjuste})`,
      );
    } else {
      consejos.push(
        `Hay ${cerco.totalAvistamientos} avistamiento(s): cerco ~${km} km (${cerco.motivoAjuste})`,
      );
    }
    if (cerco.desplazamientoDesdePerdidaMetros > 120) {
      consejos.push(
        `El centro de búsqueda se desplazó ~${(cerco.desplazamientoDesdePerdidaMetros / 1000).toFixed(1)} km respecto al punto donde se perdió.`,
      );
    }
    const avs = [...(opciones.avistamientos ?? [])].sort(
      (a, b) => a.numeroReporte - b.numeroReporte
    );
    if (avs.length >= 2) {
      const primero = avs[0];
      const ultimo = avs[avs.length - 1];
      const kmRuta = (
        distanciaMetros(primero.lat, primero.lng, ultimo.lat, ultimo.lng) / 1000
      ).toFixed(1);
      consejos.push(
        `Entre el avistamiento #${primero.numeroReporte} y el #${ultimo.numeroReporte} hay ~${kmRuta} km: prioriza buscar cerca del más reciente.`,
      );
    } else if (cerco.ultimoAvistamiento) {
      consejos.push(
        "Concentra la búsqueda alrededor del último avistamiento y los refugios marcados en el mapa.",
      );
    }
  } else if (opciones.totalAvistamientos > 0) {
    consejos.push(
      `Hay ${opciones.totalAvistamientos} avistamiento(s): sigue la ruta en el mapa de más antiguo a reciente.`,
    );
  } else {
    consejos.push(
      "Aún no hay avistamientos: coloca carteles en las esquinas del perímetro naranja del mapa.",
    );
  }

  const refugios = opciones.zonasRefugio
    .slice(0, 3)
    .map((z) => z.etiqueta.toLowerCase())
    .join(", ");
  consejos.push(`Zonas probables de refugio: ${refugios}.`);

  if (opciones.esGato) {
    consejos.push(
      "Para gatos: busca al amanecer con linterna; revisa debajo de autos, en estacionamientos y patios vecinos.",
    );
  } else {
    consejos.push(
      "Para perros: lleva premios y juguetes que suenen; evita perseguirlo si lo ves — siéntate y espera.",
    );
  }

  if (conductual.refugiosTipicos.length > 0) {
    consejos.push(
      `Lugares típicos para esta raza/tamaño: ${conductual.refugiosTipicos.join(", ")}.`,
    );
  }

  return consejos;
}
