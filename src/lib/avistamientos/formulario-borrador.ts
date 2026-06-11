/**
 * Validación y armado del wizard de reporte de avistamiento.
 */
import type { DatosAvistamiento } from "@/actions/avistamientos";
import type { Coordenadas, UbicacionSeleccionada } from "@/lib/geo/tipos";
import { coordenadasValidas } from "@/lib/geo/tipos";
import { parsearRaza } from "@/lib/mascotas/razas";
import { TAMANOS } from "@/lib/mascotas/catalogos";
import {
  MSG_UBICACION_AVISTAMIENTO,
  MSG_UBICACION_CORTA_AVISTAMIENTO,
  errorSiSinUbicacion,
} from "@/lib/reportes/validaciones";
import type { CaracteristicasVisuales } from "@/lib/visual/extraer-caracteristicas";
import { preprocesarFotoAvistamiento } from "@/lib/imagen/preprocesar-cliente";

export function validarPasoAvistamiento(opciones: {
  paso: number;
  pasoFinal: number;
  avistamientoDesdeFicha: boolean;
  ubicacion: UbicacionSeleccionada | null;
  tipo: string;
}): string | null {
  const { paso, pasoFinal, avistamientoDesdeFicha, ubicacion, tipo } = opciones;

  if (avistamientoDesdeFicha && paso === 1) {
    return errorSiSinUbicacion(ubicacion, MSG_UBICACION_AVISTAMIENTO);
  }

  if (!avistamientoDesdeFicha && paso === 2) {
    return errorSiSinUbicacion(ubicacion, MSG_UBICACION_AVISTAMIENTO);
  }

  if (paso === pasoFinal && !tipo.trim()) {
    return "Indica si es perro o gato.";
  }

  return null;
}

export function validarPublicacionAvistamiento(opciones: {
  ubicacion: UbicacionSeleccionada | null;
  tipo: string;
}): string | null {
  const errUbicacion = errorSiSinUbicacion(
    opciones.ubicacion,
    MSG_UBICACION_CORTA_AVISTAMIENTO
  );
  if (errUbicacion) return errUbicacion;

  if (!opciones.tipo.trim()) {
    return "Indica si es perro o gato.";
  }

  return null;
}

export function mapearTamanoEstimado(
  tamanoEstimado: CaracteristicasVisuales["tamanoEstimado"]
): string | undefined {
  const mapa: Record<string, string> = {
    pequeño: TAMANOS[0],
    mediano: TAMANOS[1],
    grande: TAMANOS[2],
  };
  return mapa[tamanoEstimado];
}

export function parcheCaracteristicasVisuales(
  c: CaracteristicasVisuales,
  actual: { color: string; tamano: string }
): { color?: string; tamano?: string } {
  const parche: { color?: string; tamano?: string } = {};
  if (!actual.color.trim()) {
    parche.color = c.colorPredominante;
  }
  if (!actual.tamano) {
    const tamano = mapearTamanoEstimado(c.tamanoEstimado);
    if (tamano) parche.tamano = tamano;
  }
  return parche;
}

export function armarDatosAvistamiento(
  fd: FormData,
  opciones: {
    ubicacion: UbicacionSeleccionada | null;
    mascotaId?: string;
    mascotaSeleccionada?: string;
    direccion: string;
    tipo: string;
    tamano: string;
    color: string;
    razaCompuesta: string;
    fotoAvistamiento: string | null;
    referencias: string;
    direccionMovimiento: string;
    fechaAvistamiento: string;
  }
): DatosAvistamiento | null {
  const { ubicacion } = opciones;
  if (!coordenadasValidas(ubicacion)) return null;

  const mascotaId =
    opciones.mascotaId || opciones.mascotaSeleccionada || undefined;

  return {
    mascotaId,
    lat: ubicacion.lat,
    lng: ubicacion.lng,
    direccion: opciones.direccion.trim() || undefined,
    tipoMascota: opciones.tipo,
    tamano: opciones.tamano || fd.get("tamano")?.toString(),
    color: opciones.color.trim() || undefined,
    raza: opciones.razaCompuesta || undefined,
    fotoUrl: opciones.fotoAvistamiento ?? undefined,
    referencias:
      opciones.referencias.trim() || fd.get("referencia")?.toString(),
    direccionMovimiento:
      opciones.direccionMovimiento ||
      fd.get("direccionMovimiento")?.toString(),
    fechaHora: opciones.fechaAvistamiento,
  };
}

export type CamposBorradorAvistamiento = {
  ubicacion: Coordenadas;
  direccion: string;
  tipo: string;
  color: string;
  razaSeleccion: string;
  razaOtra: string;
  tamano: string;
  fotoAvistamiento: string | null;
  fechaAvistamiento: string;
  referencias: string;
  direccionMovimiento: string;
  mascotaSeleccionada: string;
};

export function camposDesdeBorradorAvistamiento(
  datos: DatosAvistamiento
): CamposBorradorAvistamiento {
  const razaIni = parsearRaza(datos.tipoMascota ?? "", datos.raza);
  return {
    ubicacion: { lat: datos.lat, lng: datos.lng },
    direccion: datos.direccion ?? "",
    tipo: datos.tipoMascota ?? "",
    color: datos.color ?? "",
    razaSeleccion: razaIni.seleccion,
    razaOtra: razaIni.otra,
    tamano: datos.tamano ?? "",
    fotoAvistamiento: datos.fotoUrl ?? null,
    fechaAvistamiento: datos.fechaHora ?? "",
    referencias: datos.referencias ?? "",
    direccionMovimiento: datos.direccionMovimiento ?? "",
    mascotaSeleccionada: datos.mascotaId ?? "",
  };
}

export async function prepararDatosAvistamientoPublicacion(
  fd: FormData,
  opciones: Parameters<typeof armarDatosAvistamiento>[1]
): Promise<DatosAvistamiento | null> {
  const datos = armarDatosAvistamiento(fd, opciones);
  if (!datos) return null;
  if (!datos.fotoUrl) return datos;
  return {
    ...datos,
    fotoUrl: await preprocesarFotoAvistamiento(datos.fotoUrl),
  };
}
