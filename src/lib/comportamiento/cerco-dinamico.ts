import { distanciaMetros } from "@/lib/geo/distancia";
import type { Coordenadas } from "@/lib/geo/tipos";

export type PuntoAvistamientoCerco = {
  lat: number;
  lng: number;
  numeroReporte: number;
};

export type TendenciaCerco = "contraido" | "ampliado" | "estable" | "equilibrado";

export type OpcionesCercoDinamico = {
  /** Radio tras tiempo + perfil conductual (M5) */
  radioTemporalMetros: number;
  radioBaseMetros: number;
  horasDesdePerdida: number;
};

export type CercoDinamico = {
  centroLat: number;
  centroLng: number;
  radioMetros: number;
  radioTemporalMetros: number;
  /** Radio si solo miramos dispersión de avistamientos */
  radioPorAvistamientosMetros: number;
  /** Radio cuando avistamientos están muy juntos */
  radioPorConcentracionMetros: number;
  desplazamientoDesdePerdidaMetros: number;
  ultimoAvistamiento: Coordenadas | null;
  totalAvistamientos: number;
  tendencia: TendenciaCerco;
  motivoAjuste: string;
};

function maximaDistanciaEntrePuntos(puntos: Coordenadas[]): number {
  let max = 0;
  for (let i = 0; i < puntos.length; i++) {
    for (let j = i + 1; j < puntos.length; j++) {
      const d = distanciaMetros(
        puntos[i].lat,
        puntos[i].lng,
        puntos[j].lat,
        puntos[j].lng
      );
      if (d > max) max = d;
    }
  }
  return max;
}

/** Ajuste por etapa: primeras horas búsqueda más focalizada */
function radioTemporalEfectivo(
  radioTemporalMetros: number,
  horasDesdePerdida: number
): number {
  if (horasDesdePerdida < 6) {
    return Math.round(radioTemporalMetros * (0.62 + horasDesdePerdida * 0.055));
  }
  if (horasDesdePerdida < 24) {
    return Math.round(
      radioTemporalMetros * (0.88 + Math.min(horasDesdePerdida - 6, 18) * 0.005)
    );
  }
  return radioTemporalMetros;
}

/**
 * Cerco dinámico: puede **contraerse** (concentración, primeras horas, perfil)
 * o **ampliarse** (tiempo, avistamientos lejanos).
 */
export function calcularCercoDinamico(
  puntoPerdida: Coordenadas,
  avistamientos: PuntoAvistamientoCerco[],
  opciones: OpcionesCercoDinamico
): CercoDinamico {
  const { radioTemporalMetros, radioBaseMetros, horasDesdePerdida } = opciones;
  const radioEfectivoTemporal = radioTemporalEfectivo(
    radioTemporalMetros,
    horasDesdePerdida
  );

  const ordenados = [...avistamientos].sort(
    (a, b) => a.numeroReporte - b.numeroReporte
  );

  if (ordenados.length === 0) {
    const tendencia: TendenciaCerco =
      radioEfectivoTemporal < radioTemporalMetros * 0.92
        ? "contraido"
        : "estable";
    return {
      centroLat: puntoPerdida.lat,
      centroLng: puntoPerdida.lng,
      radioMetros: radioEfectivoTemporal,
      radioTemporalMetros: radioEfectivoTemporal,
      radioPorAvistamientosMetros: radioEfectivoTemporal,
      radioPorConcentracionMetros: radioEfectivoTemporal,
      desplazamientoDesdePerdidaMetros: 0,
      ultimoAvistamiento: null,
      totalAvistamientos: 0,
      tendencia,
      motivoAjuste:
        tendencia === "contraido"
          ? "Zona focalizada: pocas horas desde la pérdida y perfil de la mascota."
          : "Zona según raza, tamaño y tiempo desde la pérdida.",
    };
  }

  const ultimo = ordenados[ordenados.length - 1];
  const ultimoAvistamiento = { lat: ultimo.lat, lng: ultimo.lng };

  let pesoTotal = 0.35;
  let latSum = puntoPerdida.lat * 0.35;
  let lngSum = puntoPerdida.lng * 0.35;

  ordenados.forEach((av, i) => {
    const peso = 0.65 * ((i + 1) / ordenados.length);
    pesoTotal += peso;
    latSum += av.lat * peso;
    lngSum += av.lng * peso;
  });

  const centroLat = latSum / pesoTotal;
  const centroLng = lngSum / pesoTotal;

  const todosLosPuntos = [
    puntoPerdida,
    ...ordenados.map((a) => ({ lat: a.lat, lng: a.lng })),
  ];
  const soloAvistamientos = ordenados.map((a) => ({ lat: a.lat, lng: a.lng }));

  let maxDesdeCentro = 0;
  for (const p of todosLosPuntos) {
    const d = distanciaMetros(centroLat, centroLng, p.lat, p.lng);
    if (d > maxDesdeCentro) maxDesdeCentro = d;
  }

  let maxSoloAvDesdeCentro = 0;
  for (const p of soloAvistamientos) {
    const d = distanciaMetros(centroLat, centroLng, p.lat, p.lng);
    if (d > maxSoloAvDesdeCentro) maxSoloAvDesdeCentro = d;
  }

  const extensionRuta = maximaDistanciaEntrePuntos(todosLosPuntos);
  const concentracionAv = maximaDistanciaEntrePuntos(soloAvistamientos);

  const radioPorExtension = Math.round(
    Math.max(maxDesdeCentro * 1.18, extensionRuta * 0.55) + 140
  );
  const radioPorConcentracion = Math.round(
    Math.max(
      maxSoloAvDesdeCentro * 1.12 + 100,
      concentracionAv * 0.52 + 120
    )
  );

  const desplazamientoDesdePerdidaMetros = Math.round(
    distanciaMetros(
      puntoPerdida.lat,
      puntoPerdida.lng,
      centroLat,
      centroLng
    )
  );

  const limiteMin = Math.max(160, Math.round(radioBaseMetros * 0.35));
  const limiteMax = Math.round(radioBaseMetros * 3.5);

  let radioMetros: number;
  let tendencia: TendenciaCerco;
  let motivoAjuste: string;

  const muyDisperso =
    radioPorExtension > radioEfectivoTemporal * 1.1 &&
    extensionRuta > Math.max(500, radioEfectivoTemporal * 0.5);
  const muyConcentrado =
    radioPorConcentracion < radioEfectivoTemporal * 0.72 ||
    (extensionRuta < 400 && ordenados.length >= 1);

  if (muyDisperso && !muyConcentrado) {
    radioMetros = Math.round(
      radioPorExtension * 0.88 + radioEfectivoTemporal * 0.12
    );
    tendencia = "ampliado";
    motivoAjuste =
      "Los avistamientos se alejaron del punto de pérdida: el cerco cubre la ruta recorrida.";
  } else if (muyConcentrado && radioPorConcentracion < radioPorExtension * 0.85) {
    radioMetros = Math.round(
      radioPorConcentracion * 0.82 + radioEfectivoTemporal * 0.18
    );
    tendencia = "contraido";
    motivoAjuste =
      "Avistamientos muy cercanos entre sí: búsqueda más focalizada cerca de esa zona.";
  } else {
    radioMetros = Math.round(
      (radioEfectivoTemporal + radioPorConcentracion + radioPorExtension) / 3
    );
    tendencia = "equilibrado";
    motivoAjuste =
      "Combina tiempo perdido, perfil de la mascota y patrón de avistamientos.";
  }

  if (
    horasDesdePerdida < 12 &&
    tendencia !== "ampliado" &&
    radioMetros > radioPorConcentracion
  ) {
    radioMetros = Math.round(
      radioMetros * (0.82 + horasDesdePerdida * 0.012)
    );
    if (tendencia === "equilibrado") tendencia = "contraido";
    motivoAjuste = `Primeras ${Math.round(horasDesdePerdida)} h: prioriza un radio más corto. ${motivoAjuste}`;
  }

  radioMetros = Math.min(limiteMax, Math.max(limiteMin, radioMetros));

  if (
    Math.abs(radioMetros - radioEfectivoTemporal) < radioEfectivoTemporal * 0.06
  ) {
    tendencia = "estable";
  }

  return {
    centroLat,
    centroLng,
    radioMetros,
    radioTemporalMetros: radioEfectivoTemporal,
    radioPorAvistamientosMetros: radioPorExtension,
    radioPorConcentracionMetros: radioPorConcentracion,
    desplazamientoDesdePerdidaMetros,
    ultimoAvistamiento,
    totalAvistamientos: ordenados.length,
    tendencia,
    motivoAjuste,
  };
}
