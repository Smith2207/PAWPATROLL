"use server";

import { listarMisMascotas } from "@/actions/mascotas";

export type ResumenCasosNav = {
  /** Destino al pulsar «Mis mascotas» (caso directo si aplica). */
  href: string;
  pendientes: number;
  perdidas: number;
};

/** Destino inteligente para «Mis mascotas» en nav (incluye acceso a chats). */
export async function obtenerResumenCasosNav(): Promise<ResumenCasosNav> {
  const mascotas = await listarMisMascotas();

  if (mascotas.length === 0) {
    return { href: "/mis-mascotas", pendientes: 0, perdidas: 0 };
  }

  const perdidas = mascotas.filter((m) => m.estado === "PERDIDA");
  const pendientes = mascotas.reduce(
    (s, m) => s + (m.avistamientosPendientes ?? 0),
    0
  );

  if (perdidas.length === 0) {
    return { href: "/mis-mascotas", pendientes, perdidas: 0 };
  }

  const href =
    perdidas.length === 1
      ? `/mis-mascotas/${perdidas[0]!.id}/caso`
      : "/mis-mascotas#casos-activos";

  return { href, pendientes, perdidas: perdidas.length };
}
