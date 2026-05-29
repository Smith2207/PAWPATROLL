import { umbralesClip } from "@/lib/visual/config";

export type FiltrosBusquedaVisual = {
  tipoMascota?: string;
  color?: string;
  lat?: number;
  lng?: number;
};

export type MascotaParaRerank = {
  tipo: string | null;
  color: string | null;
  latPerdida: string | number | null;
  lngPerdida: string | number | null;
};

function normalizarTexto(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

function colorCoincide(a: string, b: string): boolean {
  const na = normalizarTexto(a);
  const nb = normalizarTexto(b);
  if (na === nb) return true;
  const palabrasA = na.split(/\s+/).filter((p) => p.length > 2);
  return palabrasA.some((p) => nb.includes(p));
}

function distanciaKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Suma pequeños bonuses al coseno CLIP según metadatos del avistamiento */
export function puntuacionConRerank(
  coseno: number,
  mascota: MascotaParaRerank,
  filtros?: FiltrosBusquedaVisual
): number {
  if (!filtros) return coseno;

  const u = umbralesClip();
  let bonus = 0;

  if (
    filtros.tipoMascota?.trim() &&
    mascota.tipo &&
    normalizarTexto(mascota.tipo) === normalizarTexto(filtros.tipoMascota)
  ) {
    bonus += u.bonusTipo;
  }

  if (
    filtros.color?.trim() &&
    mascota.color &&
    colorCoincide(filtros.color, mascota.color)
  ) {
    bonus += u.bonusColor;
  }

  if (
    filtros.lat != null &&
    filtros.lng != null &&
    mascota.latPerdida &&
    mascota.lngPerdida
  ) {
    const lat2 = Number(mascota.latPerdida);
    const lng2 = Number(mascota.lngPerdida);
    if (Number.isFinite(lat2) && Number.isFinite(lng2)) {
      const km = distanciaKm(filtros.lat, filtros.lng, lat2, lng2);
      if (km <= 5) bonus += u.bonusCerca;
      else if (km <= u.radioKmRerank) bonus += u.bonusCercaMedio;
    }
  }

  return coseno + bonus;
}
