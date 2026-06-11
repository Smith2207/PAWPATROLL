"use server";



/**
 * Server Actions (admin): operaciones de servidor invocadas desde la UI.
 */
import { and, count, desc, eq, gte, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { listarDatosMapaPublico, type DatosMapaPublico } from "@/actions/mapa";
import { db } from "@/lib/db";
import {
  avistamientos,
  eventosCaso,
  mascotas,
  reportesAbuso,
  sessions,
  users,
} from "@/lib/db/schema";
import { esCorreoAdmin } from "@/lib/auth/admin";

async function sesionAdmin() {
  const { auth } = await import("@/auth");
  const sesion = await auth();
  if (sesion?.user?.rol !== "ADMINISTRADOR") {
    throw new Error("No autorizado.");
  }
  return sesion.user;
}

export type ResultadoAdmin = { ok: true; mensaje?: string } | { ok: false; error: string };

export type EstadisticasAdmin = {
  usuarios: number;
  mascotas: number;
  perdidas: number;
  reunidas: number;
  avistamientos: number;
  avistamientosPendientes: number;
  avistamientosVerificados: number;
};

export type MetricasAdmin = {
  reunionesEsteMes: number;
  diasPromedioReunion: number | null;
  topColaboradores: {
    userId: string;
    nombre: string | null;
    email: string;
    total: number;
  }[];
};

export type UsuarioAdmin = {
  id: string;
  name: string | null;
  email: string;
  rol: string;
  activo: boolean;
  totalMascotas: number;
  totalAvistamientos: number;
};

function escaparCsv(valor: string) {
  return `"${valor.replace(/"/g, '""')}"`;
}

function inicioMesActual() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

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

export async function obtenerMetricasAdmin(): Promise<MetricasAdmin> {
  await sesionAdmin();

  const desdeMes = inicioMesActual();

  const [[reunionesMes], [promedio], topColaboradores] = await Promise.all([
    db
      .select({ n: count() })
      .from(eventosCaso)
      .where(
        and(
          eq(eventosCaso.tipo, "MASCOTA_RECUPERADA"),
          gte(eventosCaso.createdAt, desdeMes)
        )
      ),
    db
      .select({
        dias: sql<number | null>`avg(
          extract(epoch from (${eventosCaso.createdAt} - ${mascotas.fechaPerdida})) / 86400
        )`,
      })
      .from(eventosCaso)
      .innerJoin(mascotas, eq(eventosCaso.mascotaId, mascotas.id))
      .where(
        and(
          eq(eventosCaso.tipo, "MASCOTA_RECUPERADA"),
          sql`${mascotas.fechaPerdida} is not null`
        )
      ),
    db
      .select({
        userId: avistamientos.userId,
        nombre: users.name,
        email: users.email,
        total: sql<number>`count(*)::int`,
      })
      .from(avistamientos)
      .innerJoin(users, eq(avistamientos.userId, users.id))
      .where(ne(avistamientos.estado, "DESCARTADO"))
      .groupBy(avistamientos.userId, users.name, users.email)
      .orderBy(sql`count(*) desc`)
      .limit(5),
  ]);

  const diasRaw = promedio?.dias;
  const diasPromedioReunion =
    diasRaw != null && Number.isFinite(Number(diasRaw))
      ? Math.round(Number(diasRaw) * 10) / 10
      : null;

  return {
    reunionesEsteMes: reunionesMes?.n ?? 0,
    diasPromedioReunion,
    topColaboradores: topColaboradores
      .filter((f) => f.userId)
      .map((f) => ({
        userId: f.userId!,
        nombre: f.nombre,
        email: f.email,
        total: f.total,
      })),
  };
}

export async function obtenerDatosMapaAdmin(): Promise<DatosMapaPublico> {
  await sesionAdmin();
  return listarDatosMapaPublico({});
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

export async function actualizarEstadoReporteAbuso(
  id: string,
  estado: "RESUELTO" | "DESCARTADO"
): Promise<ResultadoAdmin> {
  await sesionAdmin();

  const [actual] = await db
    .select({ id: reportesAbuso.id, estado: reportesAbuso.estado })
    .from(reportesAbuso)
    .where(eq(reportesAbuso.id, id))
    .limit(1);

  if (!actual) {
    return { ok: false, error: "Reporte no encontrado." };
  }

  if (actual.estado !== "PENDIENTE") {
    return { ok: false, error: "Este reporte ya fue procesado." };
  }

  await db.update(reportesAbuso).set({ estado }).where(eq(reportesAbuso.id, id));

  revalidatePath("/admin");
  return {
    ok: true,
    mensaje: estado === "RESUELTO" ? "Reporte marcado como resuelto." : "Reporte descartado.",
  };
}

export async function listarUsuariosAdmin(
  busqueda = "",
  limite = 40
): Promise<UsuarioAdmin[]> {
  await sesionAdmin();

  const termino = busqueda.trim();
  const condiciones = termino
    ? [
        or(
          ilike(users.email, `%${termino}%`),
          ilike(users.name, `%${termino}%`)
        ),
      ]
    : [];

  const filas = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      rol: users.rol,
      activo: users.activo,
    })
    .from(users)
    .where(condiciones.length ? and(...condiciones) : undefined)
    .orderBy(desc(users.email))
    .limit(limite);

  if (filas.length === 0) return [];

  const ids = filas.map((f) => f.id);

  const [conteosMascotas, conteosAvistamientos] = await Promise.all([
    db
      .select({
        userId: mascotas.userId,
        total: count(),
      })
      .from(mascotas)
      .where(inArray(mascotas.userId, ids))
      .groupBy(mascotas.userId),
    db
      .select({
        userId: avistamientos.userId,
        total: count(),
      })
      .from(avistamientos)
      .where(inArray(avistamientos.userId, ids))
      .groupBy(avistamientos.userId),
  ]);

  const mascotasPorUsuario = new Map(
    conteosMascotas.map((c) => [c.userId, Number(c.total)])
  );
  const avistamientosPorUsuario = new Map(
    conteosAvistamientos
      .filter((c): c is typeof c & { userId: string } => Boolean(c.userId))
      .map((c) => [c.userId, Number(c.total)])
  );

  return filas.map((f) => ({
    ...f,
    totalMascotas: mascotasPorUsuario.get(f.id) ?? 0,
    totalAvistamientos: avistamientosPorUsuario.get(f.id) ?? 0,
  }));
}

export async function alternarUsuarioActivo(userId: string): Promise<ResultadoAdmin> {
  const admin = await sesionAdmin();

  if (admin.id === userId) {
    return { ok: false, error: "No puedes desactivar tu propia cuenta." };
  }

  const [usuario] = await db
    .select({ id: users.id, email: users.email, activo: users.activo })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!usuario) {
    return { ok: false, error: "Usuario no encontrado." };
  }

  if (esCorreoAdmin(usuario.email)) {
    return { ok: false, error: "No se puede desactivar la cuenta de soporte." };
  }

  const nuevoActivo = !usuario.activo;

  await db.update(users).set({ activo: nuevoActivo }).where(eq(users.id, userId));

  if (!nuevoActivo) {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }

  revalidatePath("/admin");
  return {
    ok: true,
    mensaje: nuevoActivo ? "Cuenta reactivada." : "Cuenta desactivada.",
  };
}

export async function exportarCsvAdmin(tipo = "avistamientos"): Promise<string> {
  await sesionAdmin();

  switch (tipo) {
    case "usuarios":
      return exportarCsvUsuarios();
    case "mascotas-perdidas":
      return exportarCsvMascotasPerdidas();
    case "reportes":
      return exportarCsvReportesAbuso();
    default:
      return exportarCsvAvistamientos();
  }
}

async function exportarCsvAvistamientos(): Promise<string> {
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
        escaparCsv(f.direccion ?? ""),
        f.tipo ?? "",
        escaparCsv(f.mascota ?? ""),
        f.creado.toISOString(),
      ].join(",")
    )
    .join("\n");

  return cabecera + cuerpo;
}

async function exportarCsvUsuarios(): Promise<string> {
  const filas = await db
    .select({
      id: users.id,
      nombre: users.name,
      email: users.email,
      rol: users.rol,
      activo: users.activo,
      ciudad: users.ciudad,
    })
    .from(users)
    .orderBy(desc(users.email))
    .limit(1000);

  const cabecera = "id,nombre,email,rol,activo,ciudad\n";
  const cuerpo = filas
    .map((f) =>
      [
        f.id,
        escaparCsv(f.nombre ?? ""),
        escaparCsv(f.email),
        f.rol,
        f.activo ? "si" : "no",
        escaparCsv(f.ciudad ?? ""),
      ].join(",")
    )
    .join("\n");

  return cabecera + cuerpo;
}

async function exportarCsvMascotasPerdidas(): Promise<string> {
  const filas = await db
    .select({
      id: mascotas.id,
      nombre: mascotas.nombre,
      tipo: mascotas.tipo,
      raza: mascotas.raza,
      slug: mascotas.slug,
      lugar: mascotas.lugarPerdida,
      lat: mascotas.latPerdida,
      lng: mascotas.lngPerdida,
      fechaPerdida: mascotas.fechaPerdida,
      duenoEmail: users.email,
    })
    .from(mascotas)
    .innerJoin(users, eq(mascotas.userId, users.id))
    .where(eq(mascotas.estado, "PERDIDA"))
    .orderBy(desc(mascotas.updatedAt))
    .limit(500);

  const cabecera =
    "id,nombre,tipo,raza,slug,lugar,lat,lng,fecha_perdida,dueno_email\n";
  const cuerpo = filas
    .map((f) =>
      [
        f.id,
        escaparCsv(f.nombre),
        escaparCsv(f.tipo),
        escaparCsv(f.raza ?? ""),
        f.slug,
        escaparCsv(f.lugar ?? ""),
        f.lat ?? "",
        f.lng ?? "",
        f.fechaPerdida?.toISOString() ?? "",
        escaparCsv(f.duenoEmail),
      ].join(",")
    )
    .join("\n");

  return cabecera + cuerpo;
}

async function exportarCsvReportesAbuso(): Promise<string> {
  const filas = await db
    .select({
      id: reportesAbuso.id,
      estado: reportesAbuso.estado,
      motivo: reportesAbuso.motivo,
      avistamientoId: reportesAbuso.avistamientoId,
      numeroReporte: avistamientos.numeroReporte,
      mascota: mascotas.nombre,
      reportante: users.email,
      creado: reportesAbuso.createdAt,
    })
    .from(reportesAbuso)
    .innerJoin(avistamientos, eq(reportesAbuso.avistamientoId, avistamientos.id))
    .leftJoin(mascotas, eq(avistamientos.mascotaId, mascotas.id))
    .innerJoin(users, eq(reportesAbuso.reportadoPor, users.id))
    .orderBy(desc(reportesAbuso.createdAt))
    .limit(500);

  const cabecera =
    "id,estado,motivo,avistamiento_id,numero_reporte,mascota,reportante,creado\n";
  const cuerpo = filas
    .map((f) =>
      [
        f.id,
        f.estado,
        escaparCsv(f.motivo),
        f.avistamientoId,
        f.numeroReporte,
        escaparCsv(f.mascota ?? ""),
        escaparCsv(f.reportante),
        f.creado.toISOString(),
      ].join(",")
    )
    .join("\n");

  return cabecera + cuerpo;
}
