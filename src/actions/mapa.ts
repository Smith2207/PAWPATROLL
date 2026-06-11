"use server";



/**
 * Server Actions (mapa): operaciones de servidor invocadas desde la UI.
 */
import { and, desc, eq, gte, inArray, ne } from "drizzle-orm";
import type { FiltrosMapaPublico } from "@/lib/mapa/filtros";
import { db } from "@/lib/db";
import {
  avistamientos,
  mascotaFotos,
  mascotas,
} from "@/lib/db/schema";
import { estimarRadioBusquedaMetros } from "@/lib/comportamiento/evidencia-radios";
import { calcularPrediccionComportamiento } from "@/lib/comportamiento/prediccion";
import type { PrediccionComportamiento } from "@/lib/comportamiento/prediccion";
import { coordenadasDesdeValores, type Coordenadas } from "@/lib/geo/tipos";
import { TIPOS_MASCOTA } from "@/lib/mascotas/tipos";

export type MarcadorPerdidaMapa = {
  id: string;
  slug: string;
  nombre: string;
  tipo: string;
  /** Pin: punto donde se perdió */
  lat: number;
  lng: number;
  /** Centro del cerco naranja (puede desplazarse con avistamientos) */
  cercoLat: number;
  cercoLng: number;
  radioMetros: number;
  lugarPerdida: string | null;
  fotoPrincipal: string | null;
  totalAvistamientos: number;
  /** Ruta de avistamientos #1 → #2 → #3 (solo visual) */
  rutaAvistamientos: Coordenadas[];
  prediccion?: PrediccionComportamiento | null;
};

export type MarcadorAvistamientoMapa = {
  id: string;
  mascotaId: string | null;
  numeroReporte: number;
  lat: number;
  lng: number;
  direccion: string | null;
  nombreMascota: string | null;
  slugMascota: string | null;
  /** Primera foto de la mascota vinculada */
  fotoMascota: string | null;
  /** Foto adjunta al reporte de avistamiento */
  fotoAvistamiento: string | null;
  enTiempoReal: boolean;
  estado: string;
  createdAt: Date;
};

export type DatosMapaPublico = {
  perdidas: MarcadorPerdidaMapa[];
  avistamientos: MarcadorAvistamientoMapa[];
  puntosCalor: [number, number, number][];
  prediccion?: PrediccionComportamiento | null;
};

/** Mapa y predicción M5 exclusivos de una mascota perdida */
export type DatosMapaMascota = DatosMapaPublico & {
  mascotaId: string;
  nombreMascota: string;
};

function soloPerrosYGatos() {
  return inArray(mascotas.tipo, [...TIPOS_MASCOTA]);
}

async function mapaPrimeraFotoPorMascota(ids: string[]) {
  const mapa = new Map<string, string>();
  if (ids.length === 0) return mapa;

  const fotos = await db
    .select({
      mascotaId: mascotaFotos.mascotaId,
      url: mascotaFotos.url,
    })
    .from(mascotaFotos)
    .where(inArray(mascotaFotos.mascotaId, ids))
    .orderBy(mascotaFotos.orden);

  for (const f of fotos) {
    if (!mapa.has(f.mascotaId)) mapa.set(f.mascotaId, f.url);
  }
  return mapa;
}

export async function listarDatosMapaPublico(
  filtros: FiltrosMapaPublico = {}
): Promise<DatosMapaPublico> {
  const condicionesPerdidas = [
    eq(mascotas.estado, "PERDIDA"),
    soloPerrosYGatos(),
  ];
  if (filtros.tipoMascota) {
    condicionesPerdidas.push(eq(mascotas.tipo, filtros.tipoMascota));
  }
  if (filtros.dias && filtros.dias > 0) {
    const desde = new Date();
    desde.setDate(desde.getDate() - filtros.dias);
    condicionesPerdidas.push(gte(mascotas.fechaPerdida, desde));
  }

  const perdidasRaw = await db
    .select()
    .from(mascotas)
    .where(and(...condicionesPerdidas))
    .orderBy(desc(mascotas.updatedAt));

  const condicionesAv = [ne(avistamientos.estado, "DESCARTADO")];
  if (filtros.estadoAvistamiento) {
    condicionesAv.push(eq(avistamientos.estado, filtros.estadoAvistamiento));
  }
  if (filtros.dias && filtros.dias > 0) {
    const desde = new Date();
    desde.setDate(desde.getDate() - filtros.dias);
    condicionesAv.push(gte(avistamientos.createdAt, desde));
  }
  if (filtros.tipoMascota) {
    condicionesAv.push(eq(avistamientos.tipoMascota, filtros.tipoMascota));
  }

  const avistamientosRaw = await db
    .select({
      av: avistamientos,
      nombreMascota: mascotas.nombre,
      slugMascota: mascotas.slug,
    })
    .from(avistamientos)
    .leftJoin(mascotas, eq(avistamientos.mascotaId, mascotas.id))
    .where(and(...condicionesAv))
    .orderBy(desc(avistamientos.createdAt))
    .limit(200);

  const idsPerdidas = perdidasRaw.map((m) => m.id);
  const idsMascotasAv = [
    ...new Set(
      avistamientosRaw
        .map((f) => f.av.mascotaId)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const idsFotos = [...new Set([...idsPerdidas, ...idsMascotasAv])];
  const fotoPorMascota = await mapaPrimeraFotoPorMascota(idsFotos);

  const avistamientosLista: MarcadorAvistamientoMapa[] = [];

  for (const fila of avistamientosRaw) {
    const coords = coordenadasDesdeValores(fila.av.lat, fila.av.lng);
    if (!coords) continue;
    const { lat, lng } = coords;

    avistamientosLista.push({
      id: fila.av.id,
      mascotaId: fila.av.mascotaId,
      numeroReporte: fila.av.numeroReporte,
      lat,
      lng,
      direccion: fila.av.direccion,
      nombreMascota: fila.nombreMascota,
      slugMascota: fila.slugMascota,
      fotoMascota: fila.av.mascotaId
        ? (fotoPorMascota.get(fila.av.mascotaId) ?? null)
        : null,
      fotoAvistamiento:
        fila.av.fotoUrl?.startsWith("data:image/") ||
        fila.av.fotoUrl?.startsWith("http")
          ? fila.av.fotoUrl
          : null,
      enTiempoReal: fila.av.enTiempoReal,
      estado: fila.av.estado,
      createdAt: fila.av.createdAt,
    });
  }

  const avistamientosPorMascota = new Map<string, MarcadorAvistamientoMapa[]>();
  for (const a of avistamientosLista) {
    if (!a.mascotaId) continue;
    const lista = avistamientosPorMascota.get(a.mascotaId) ?? [];
    lista.push(a);
    avistamientosPorMascota.set(a.mascotaId, lista);
  }

  const perdidas: MarcadorPerdidaMapa[] = [];

  for (const m of perdidasRaw) {
    const coords = coordenadasDesdeValores(m.latPerdida, m.lngPerdida);
    if (!coords) continue;
    const { lat, lng } = coords;

    const vinculados = (avistamientosPorMascota.get(m.id) ?? []).sort(
      (a, b) => a.numeroReporte - b.numeroReporte
    );

    const prediccion = calcularPrediccionComportamiento(
      m,
      vinculados.map((av) => ({
        lat: av.lat,
        lng: av.lng,
        numeroReporte: av.numeroReporte,
      }))
    );
    const radioBase =
      prediccion?.radioActualMetros ??
      m.radioBusquedaMetros ??
      estimarRadioBusquedaMetros({
        tipo: m.tipo,
        tamano: m.tamano,
        edad: m.edad,
      });

    perdidas.push({
      id: m.id,
      slug: m.slug,
      nombre: m.nombre,
      tipo: m.tipo,
      lat,
      lng,
      cercoLat: prediccion?.cerco.centroLat ?? lat,
      cercoLng: prediccion?.cerco.centroLng ?? lng,
      radioMetros: radioBase,
      lugarPerdida: m.lugarPerdida,
      fotoPrincipal: fotoPorMascota.get(m.id) ?? null,
      totalAvistamientos: vinculados.length,
      rutaAvistamientos: vinculados.map((av) => ({ lat: av.lat, lng: av.lng })),
      prediccion,
    });
  }

  const puntosCalor: [number, number, number][] = avistamientosLista.map(
    (a) => [a.lat, a.lng, 0.6 + Math.min(a.numeroReporte, 5) * 0.08]
  );

  for (const p of perdidas) {
    puntosCalor.push([p.lat, p.lng, 0.85]);
  }

  return {
    perdidas,
    avistamientos: avistamientosLista,
    puntosCalor,
  };
}

/** Mapa centrado en una mascota perdida: cerco, avistamientos y ruta #1→#N */
export async function listarDatosMapaMascota(
  mascotaId: string
): Promise<DatosMapaMascota> {
  const [m] = await db
    .select()
    .from(mascotas)
    .where(
      and(
        eq(mascotas.id, mascotaId),
        eq(mascotas.estado, "PERDIDA"),
        soloPerrosYGatos()
      )
    )
    .limit(1);

  if (!m) {
    return {
      mascotaId,
      nombreMascota: "",
      perdidas: [],
      avistamientos: [],
      puntosCalor: [],
      prediccion: null,
    };
  }

  const avistamientosRaw = await db
    .select()
    .from(avistamientos)
    .where(
      and(
        eq(avistamientos.mascotaId, mascotaId),
        ne(avistamientos.estado, "DESCARTADO")
      )
    )
    .orderBy(avistamientos.numeroReporte);

  const avistamientosLista: MarcadorAvistamientoMapa[] = [];
  for (const av of avistamientosRaw) {
    const coords = coordenadasDesdeValores(av.lat, av.lng);
    if (!coords) continue;
    const { lat, lng } = coords;

    avistamientosLista.push({
      id: av.id,
      mascotaId: av.mascotaId,
      numeroReporte: av.numeroReporte,
      lat,
      lng,
      direccion: av.direccion,
      nombreMascota: m.nombre,
      slugMascota: m.slug,
      fotoMascota: null,
      fotoAvistamiento:
        av.fotoUrl?.startsWith("data:image/") || av.fotoUrl?.startsWith("http")
          ? av.fotoUrl
          : null,
      enTiempoReal: av.enTiempoReal,
      estado: av.estado,
      createdAt: av.createdAt,
    });
  }

  const [foto] = await db
    .select({ url: mascotaFotos.url })
    .from(mascotaFotos)
    .where(eq(mascotaFotos.mascotaId, mascotaId))
    .orderBy(mascotaFotos.orden)
    .limit(1);

  const urlFotoMascota = foto?.url ?? null;
  for (const av of avistamientosLista) {
    av.fotoMascota = urlFotoMascota;
  }

  const perdidas: MarcadorPerdidaMapa[] = [];
  const coordsPerdida = coordenadasDesdeValores(m.latPerdida, m.lngPerdida);

  const prediccion = calcularPrediccionComportamiento(
    m,
    avistamientosLista.map((av) => ({
      lat: av.lat,
      lng: av.lng,
      numeroReporte: av.numeroReporte,
    }))
  );

  if (coordsPerdida) {
    const { lat: latPerdida, lng: lngPerdida } = coordsPerdida;
    const radioBase =
      prediccion?.radioActualMetros ??
      m.radioBusquedaMetros ??
      estimarRadioBusquedaMetros({
        tipo: m.tipo,
        tamano: m.tamano,
        edad: m.edad,
      });

    perdidas.push({
      id: m.id,
      slug: m.slug,
      nombre: m.nombre,
      tipo: m.tipo,
      lat: latPerdida,
      lng: lngPerdida,
      cercoLat: prediccion?.cerco.centroLat ?? latPerdida,
      cercoLng: prediccion?.cerco.centroLng ?? lngPerdida,
      radioMetros: radioBase,
      lugarPerdida: m.lugarPerdida,
      fotoPrincipal: foto?.url ?? null,
      totalAvistamientos: avistamientosLista.length,
      rutaAvistamientos: avistamientosLista.map((av) => ({
        lat: av.lat,
        lng: av.lng,
      })),
      prediccion,
    });
  }

  const puntosCalor: [number, number, number][] = avistamientosLista.map(
    (a) => [a.lat, a.lng, 0.6 + Math.min(a.numeroReporte, 5) * 0.08]
  );

  for (const p of perdidas) {
    puntosCalor.push([p.lat, p.lng, 0.85]);
  }

  if (prediccion) {
    for (const z of prediccion.zonasRefugio) {
      puntosCalor.push([z.lat, z.lng, z.probabilidad * 0.5]);
    }
  }

  return {
    mascotaId: m.id,
    nombreMascota: m.nombre,
    perdidas,
    avistamientos: avistamientosLista,
    puntosCalor,
    prediccion,
  };
}
