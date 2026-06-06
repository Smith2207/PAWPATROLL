import { obtenerPerfilConductual } from "@/lib/comportamiento/conocimiento";
import { calcularRadioBusquedaTemporal } from "@/lib/comportamiento/radio-busqueda";
import {
  identificarZonasRefugio,
  identificarZonasRefugioConAvistamientos,
} from "@/lib/comportamiento/zonas-refugio";
import { generarConsejosBusqueda } from "@/lib/comportamiento/consejos";
import {
  calcularCercoDinamico,
  type PuntoAvistamientoCerco,
} from "@/lib/comportamiento/cerco-dinamico";
import { estimarRadioConEvidencia } from "@/lib/comportamiento/evidencia-radios";
import {
  FUENTES_COMPORTAMIENTO,
  type FuenteComportamiento,
} from "@/lib/comportamiento/fuentes";
import { parsearCoordenada } from "@/lib/geo/tipos";
import type { Mascota } from "@/lib/db/schema";

export type PrediccionComportamiento = {
  perfilConductual: ReturnType<typeof obtenerPerfilConductual>;
  radioBaseMetros: number;
  radioActualMetros: number;
  horasTranscurridas: number;
  diasTranscurridos: number;
  zonasRefugio: ReturnType<typeof identificarZonasRefugio>;
  consejos: string[];
  puntoPerdida: { lat: number; lng: number };
  cerco: ReturnType<typeof calcularCercoDinamico>;
  centro: { lat: number; lng: number };
  notaEvidencia: string;
  fuentes: FuenteComportamiento[];
};

type PerfilMascotaPrediccion = Pick<
  Mascota,
  | "tipo"
  | "raza"
  | "tamano"
  | "edad"
  | "nombre"
  | "fechaPerdida"
  | "latPerdida"
  | "lngPerdida"
  | "radioBusquedaMetros"
  | "accesoExterior"
  | "descripcion"
  | "senasParticulares"
>;

export function calcularPrediccionComportamiento(
  mascota: PerfilMascotaPrediccion,
  avistamientos: PuntoAvistamientoCerco[] = []
): PrediccionComportamiento | null {
  const lat = parsearCoordenada(mascota.latPerdida);
  const lng = parsearCoordenada(mascota.lngPerdida);
  if (lat == null || lng == null) return null;

  const perfilEntrada = {
    tipo: mascota.tipo,
    raza: mascota.raza,
    tamano: mascota.tamano,
    edad: mascota.edad,
    accesoExterior: mascota.accesoExterior,
    descripcion: mascota.descripcion,
    senasParticulares: mascota.senasParticulares,
  };

  const esGato = (mascota.tipo ?? "").toLowerCase().includes("gato");
  const conductual = obtenerPerfilConductual(perfilEntrada);
  const evidencia = estimarRadioConEvidencia(perfilEntrada);

  const radio = calcularRadioBusquedaTemporal(
    perfilEntrada,
    conductual,
    mascota.fechaPerdida,
    mascota.radioBusquedaMetros
  );

  const puntoPerdida = { lat, lng };
  const cerco = calcularCercoDinamico(puntoPerdida, avistamientos, {
    radioTemporalMetros: radio.radioActualMetros,
    radioBaseMetros: radio.radioBaseMetros,
    horasDesdePerdida: radio.horasTranscurridas,
  });

  const centroRefugios = cerco.ultimoAvistamiento ?? {
    lat: cerco.centroLat,
    lng: cerco.centroLng,
  };

  const zonasRefugio =
    avistamientos.length > 0
      ? identificarZonasRefugioConAvistamientos(
          centroRefugios,
          puntoPerdida,
          conductual,
          esGato
        )
      : identificarZonasRefugio(centroRefugios, conductual, esGato);

  const consejos = generarConsejosBusqueda({
    nombre: mascota.nombre,
    conductual,
    horasTranscurridas: radio.horasTranscurridas,
    diasTranscurridos: radio.diasTranscurridos,
    radioActualMetros: cerco.radioMetros,
    radioTemporalMetros: cerco.radioTemporalMetros,
    totalAvistamientos: cerco.totalAvistamientos,
    zonasRefugio,
    esGato,
    cerco,
    avistamientos,
  });

  const fuentesIds = new Set<string>([evidencia.fuenteId]);
  if (esGato) fuentesIds.add("mar-gatos");
  const fuentes = FUENTES_COMPORTAMIENTO.filter((f) => fuentesIds.has(f.id));

  return {
    perfilConductual: conductual,
    radioBaseMetros: radio.radioBaseMetros,
    radioActualMetros: cerco.radioMetros,
    horasTranscurridas: radio.horasTranscurridas,
    diasTranscurridos: radio.diasTranscurridos,
    zonasRefugio,
    consejos,
    puntoPerdida,
    cerco,
    centro: { lat: cerco.centroLat, lng: cerco.centroLng },
    notaEvidencia: evidencia.notaRadio,
    fuentes,
  };
}
