"use server";

import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { avistamientos, mascotas } from "@/lib/db/schema";
import { calcularPrediccionComportamiento } from "@/lib/comportamiento/prediccion";
import type { PrediccionComportamiento } from "@/lib/comportamiento/prediccion";
export async function obtenerPrediccionMascota(
  mascotaId: string
): Promise<PrediccionComportamiento | null> {
  const [mascota] = await db
    .select()
    .from(mascotas)
    .where(
      and(eq(mascotas.id, mascotaId), eq(mascotas.estado, "PERDIDA"))
    )
    .limit(1);

  if (!mascota) return null;

  const avistamientosRaw = await db
    .select({
      lat: avistamientos.lat,
      lng: avistamientos.lng,
      numeroReporte: avistamientos.numeroReporte,
    })
    .from(avistamientos)
    .where(
      and(
        eq(avistamientos.mascotaId, mascotaId),
        ne(avistamientos.estado, "DESCARTADO")
      )
    )
    .orderBy(avistamientos.numeroReporte);

  const puntos = avistamientosRaw
    .map((av) => {
      const lat = Number(av.lat);
      const lng = Number(av.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        lat,
        lng,
        numeroReporte: av.numeroReporte,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return calcularPrediccionComportamiento(mascota, puntos);
}

export type PrediccionMapaPublico = PrediccionComportamiento;
