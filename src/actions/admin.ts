"use server";

import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { avistamientos, mascotas, reportesAbuso, users } from "@/lib/db/schema";

async function sesionAdmin() {
  const { auth } = await import("@/auth");
  const sesion = await auth();
  if (sesion?.user?.rol !== "ADMINISTRADOR") {
    throw new Error("No autorizado.");
  }
  return sesion.user;
}

export type EstadisticasAdmin = {
  usuarios: number;
  mascotas: number;
  perdidas: number;
  reunidas: number;
  avistamientos: number;
  avistamientosPendientes: number;
  avistamientosVerificados: number;
};

export async function obtenerEstadisticasAdmin(): Promise<EstadisticasAdmin> {
  await sesionAdmin();

  const [[u], [m], [per], [reu], [av], [pend], [ver]] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(mascotas),
    db.select({ n: count() }).from(mascotas).where(eq(mascotas.estado, "PERDIDA")),
    db.select({ n: count() }).from(mascotas).where(eq(mascotas.estado, "REUNIDA")),
    db.select({ n: count() }).from(avistamientos),
    db
      .select({ n: count() })
      .from(avistamientos)
      .where(eq(avistamientos.estado, "PENDIENTE")),
    db
      .select({ n: count() })
      .from(avistamientos)
      .where(eq(avistamientos.estado, "VERIFICADO")),
  ]);

  return {
    usuarios: u?.n ?? 0,
    mascotas: m?.n ?? 0,
    perdidas: per?.n ?? 0,
    reunidas: reu?.n ?? 0,
    avistamientos: av?.n ?? 0,
    avistamientosPendientes: pend?.n ?? 0,
    avistamientosVerificados: ver?.n ?? 0,
  };
}

export async function listarAvistamientosAdmin(limite = 30) {
  await sesionAdmin();

  return db
    .select({
      id: avistamientos.id,
      numeroReporte: avistamientos.numeroReporte,
      estado: avistamientos.estado,
      direccion: avistamientos.direccion,
      createdAt: avistamientos.createdAt,
      nombreMascota: mascotas.nombre,
      slug: mascotas.slug,
    })
    .from(avistamientos)
    .leftJoin(mascotas, eq(avistamientos.mascotaId, mascotas.id))
    .orderBy(sql`${avistamientos.createdAt} desc`)
    .limit(limite);
}

export async function listarReportesAbusoAdmin(limite = 25) {
  await sesionAdmin();

  return db
    .select({
      id: reportesAbuso.id,
      motivo: reportesAbuso.motivo,
      estado: reportesAbuso.estado,
      createdAt: reportesAbuso.createdAt,
      avistamientoId: reportesAbuso.avistamientoId,
      numeroReporte: avistamientos.numeroReporte,
      nombreMascota: mascotas.nombre,
      reportante: users.name,
      reportanteEmail: users.email,
    })
    .from(reportesAbuso)
    .innerJoin(avistamientos, eq(reportesAbuso.avistamientoId, avistamientos.id))
    .leftJoin(mascotas, eq(avistamientos.mascotaId, mascotas.id))
    .innerJoin(users, eq(reportesAbuso.reportadoPor, users.id))
    .orderBy(desc(reportesAbuso.createdAt))
    .limit(limite);
}

export async function exportarCsvAdmin(): Promise<string> {
  await sesionAdmin();

  const filas = await db
    .select({
      id: avistamientos.id,
      numero: avistamientos.numeroReporte,
      estado: avistamientos.estado,
      lat: avistamientos.lat,
      lng: avistamientos.lng,
      direccion: avistamientos.direccion,
      tipo: avistamientos.tipoMascota,
      mascota: mascotas.nombre,
      creado: avistamientos.createdAt,
    })
    .from(avistamientos)
    .leftJoin(mascotas, eq(avistamientos.mascotaId, mascotas.id))
    .orderBy(sql`${avistamientos.createdAt} desc`)
    .limit(500);

  const cabecera =
    "id,numero_reporte,estado,lat,lng,direccion,tipo_mascota,mascota,creado\n";
  const cuerpo = filas
    .map((f) =>
      [
        f.id,
        f.numero,
        f.estado,
        f.lat,
        f.lng,
        `"${(f.direccion ?? "").replace(/"/g, '""')}"`,
        f.tipo ?? "",
        `"${(f.mascota ?? "").replace(/"/g, '""')}"`,
        f.creado.toISOString(),
      ].join(",")
    )
    .join("\n");

  return cabecera + cuerpo;
}
