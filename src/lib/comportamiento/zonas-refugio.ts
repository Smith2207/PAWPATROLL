/**
 * Comportamiento predictivo (M5): zonas-refugio.
 */
import type { Coordenadas } from "@/lib/geo/tipos";
import type { PerfilConductual } from "@/lib/comportamiento/conocimiento";

export type ZonaRefugioProbable = {
  id: string;
  lat: number;
  lng: number;
  etiqueta: string;
  tipo: string;
  probabilidad: number;
};

function desplazarMetros(
  lat: number,
  lng: number,
  metros: number,
  rumboGrados: number
): Coordenadas {
  const R = 6_371_000;
  const br = (rumboGrados * Math.PI) / 180;
  const dLat = ((metros * Math.cos(br)) / R) * (180 / Math.PI);
  const dLng =
    ((metros * Math.sin(br)) / (R * Math.cos((lat * Math.PI) / 180))) *
    (180 / Math.PI);
  return { lat: lat + dLat, lng: lng + dLng };
}

const PLANTILLAS_REFUGIO = [
  { rumbo: 15, tipo: "zona_verde", etiqueta: "Parque o área verde" },
  { rumbo: 95, tipo: "estacionamiento", etiqueta: "Estacionamiento / cochera" },
  { rumbo: 180, tipo: "callejon", etiqueta: "Callejón o pasaje" },
  { rumbo: 250, tipo: "comercio", etiqueta: "Cerca de comercios / basura" },
  { rumbo: 310, tipo: "sombra", etiqueta: "Zona con sombra / edificios" },
  { rumbo: 45, tipo: "agua", etiqueta: "Cerca de agua o canal" },
  { rumbo: 60, tipo: "porche", etiqueta: "Porche / debajo de estructuras" },
] as const;

/** Puntos probables de refugio alrededor del último lugar visto (M5). */
export function identificarZonasRefugio(
  centro: Coordenadas,
  conductual: PerfilConductual,
  esGato: boolean
): ZonaRefugioProbable[] {
  const esInterior =
    conductual.contexto?.acceso === "solo_interior" ||
    conductual.contexto?.acceso === "patio_supervisado";
  const factorDist = esGato ? (esInterior ? 0.55 : 0.85) : esInterior ? 0.7 : 1;
  const distancia = conductual.distanciaRefugioMetros * factorDist;
  const plantillas = esGato
    ? PLANTILLAS_REFUGIO.filter((p) =>
        ["estacionamiento", "sombra", "callejon", "zona_verde", "porche"].includes(
          p.tipo
        )
      )
    : PLANTILLAS_REFUGIO;

  return plantillas.map((p, i) => {
    const variacion = 0.85 + (i % 3) * 0.08;
    const coords = desplazarMetros(
      centro.lat,
      centro.lng,
      distancia * variacion,
      p.rumbo
    );
    const probBase = esGato ? 0.72 : 0.65;
    return {
      id: `refugio-${p.tipo}-${i}`,
      lat: coords.lat,
      lng: coords.lng,
      etiqueta: p.etiqueta,
      tipo: p.tipo,
      probabilidad: Math.min(0.95, probBase + (i % 2) * 0.06),
    };
  });
}

/** Refugios alrededor del último avistamiento y a lo largo del desplazamiento. */
export function identificarZonasRefugioConAvistamientos(
  ultimoAvistamiento: Coordenadas,
  puntoPerdida: Coordenadas,
  conductual: PerfilConductual,
  esGato: boolean
): ZonaRefugioProbable[] {
  const cercaUltimo = identificarZonasRefugio(
    ultimoAvistamiento,
    conductual,
    esGato
  ).map((z, i) => ({
    ...z,
    id: `refugio-ultimo-${z.id}`,
    probabilidad: Math.min(0.98, z.probabilidad + 0.12),
    etiqueta: `${z.etiqueta} (cerca del avistamiento más reciente)`,
  }));

  const dx = ultimoAvistamiento.lat - puntoPerdida.lat;
  const dy = ultimoAvistamiento.lng - puntoPerdida.lng;
  const rumbo =
    ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;

  const medio = {
    lat: (puntoPerdida.lat + ultimoAvistamiento.lat) / 2,
    lng: (puntoPerdida.lng + ultimoAvistamiento.lng) / 2,
  };

  const enRuta = identificarZonasRefugio(medio, conductual, esGato)
    .slice(0, 3)
    .map((z, i) => {
      const coords = desplazarMetros(
        medio.lat,
        medio.lng,
        conductual.distanciaRefugioMetros * 0.55,
        (rumbo + i * 40) % 360
      );
      return {
        ...z,
        id: `refugio-ruta-${i}`,
        lat: coords.lat,
        lng: coords.lng,
        etiqueta: `Posible refugio en la ruta de desplazamiento`,
        probabilidad: 0.58 + i * 0.05,
      };
    });

  return [...cercaUltimo, ...enRuta];
}
