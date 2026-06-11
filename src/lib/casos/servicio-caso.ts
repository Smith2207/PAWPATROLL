/**
 * Coordinación de casos (dueño/testigo): servicio-caso.
 */
import { and, eq, gte, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  eventosCaso,
  mascotas,
  notificaciones,
  users,
  type EventoCasoTipo,
  type NotificacionTipo,
  type PrioridadNotificacion,
} from "@/lib/db/schema";
import { emitirTiempoReal } from "@/lib/tiempo-real/hub";

const VENTANA_DEDUP_MS = 30 * 60 * 1000;

type CrearNotificacionInput = {
  userId: string;
  tipo: NotificacionTipo;
  titulo: string;
  cuerpo?: string;
  enlace?: string;
  mascotaId?: string;
  avistamientoId?: string;
  prioridad?: PrioridadNotificacion;
  grupoClave?: string;
};

export async function usuarioAceptaNotificacionesInApp(
  userId: string
): Promise<boolean> {
  const [u] = await db
    .select({ activo: users.notificacionesInApp })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return u?.activo !== false;
}

export async function usuarioAceptaNotificacionesEmail(
  userId: string
): Promise<boolean> {
  const [u] = await db
    .select({ activo: users.notificacionesEmail })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return u?.activo !== false;
}

/** Notificación privada a un solo usuario. Evita duplicados recientes. */
export async function crearNotificacionPrivada(
  input: CrearNotificacionInput
): Promise<string | null> {
  const acepta = await usuarioAceptaNotificacionesInApp(input.userId);
  if (!acepta) return null;

  const grupoClave =
    input.grupoClave ??
    `${input.tipo}:${input.mascotaId ?? ""}:${input.avistamientoId ?? ""}`;

  const desde = new Date(Date.now() - VENTANA_DEDUP_MS);
  const [existente] = await db
    .select({ id: notificaciones.id })
    .from(notificaciones)
    .where(
      and(
        eq(notificaciones.userId, input.userId),
        eq(notificaciones.grupoClave, grupoClave),
        isNull(notificaciones.leidaAt),
        gte(notificaciones.createdAt, desde)
      )
    )
    .limit(1);

  if (existente) return existente.id;

  const [insertada] = await db
    .insert(notificaciones)
    .values({
      userId: input.userId,
      tipo: input.tipo,
      titulo: input.titulo,
      cuerpo: input.cuerpo,
      enlace: input.enlace,
      mascotaId: input.mascotaId,
      avistamientoId: input.avistamientoId,
      prioridad: input.prioridad ?? "NORMAL",
      grupoClave,
    })
    .returning({ id: notificaciones.id });

  emitirTiempoReal({
    tipo: "notificacion:nueva",
    userId: input.userId,
    notificacionId: insertada.id,
    notifTipo: input.tipo,
    titulo: input.titulo,
    cuerpo: input.cuerpo,
    enlace: input.enlace,
  });

  return insertada.id;
}

type CrearEventoCasoInput = {
  mascotaId: string;
  tipo: EventoCasoTipo;
  titulo: string;
  detalle?: string;
  avistamientoId?: string;
  actorUserId?: string;
  metadata?: Record<string, unknown>;
};

/** Registra actividad en la línea de tiempo del caso (mascota perdida). */
export async function registrarEventoCaso(
  input: CrearEventoCasoInput
): Promise<string> {
  const [ev] = await db
    .insert(eventosCaso)
    .values({
      mascotaId: input.mascotaId,
      avistamientoId: input.avistamientoId,
      tipo: input.tipo,
      titulo: input.titulo,
      detalle: input.detalle,
      actorUserId: input.actorUserId,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    })
    .returning({ id: eventosCaso.id });

  emitirTiempoReal({
    tipo: "caso:actualizado",
    mascotaId: input.mascotaId,
  });

  return ev.id;
}

/** Registra coincidencia de IA en el caso y avisa al dueño (solo él). */
export async function registrarCoincidenciaIaDueno(input: {
  mascotaId: string;
  avistamientoId?: string;
  similitud?: number;
  detalle?: string;
}) {
  const [m] = await db
    .select({ userId: mascotas.userId, nombre: mascotas.nombre })
    .from(mascotas)
    .where(eq(mascotas.id, input.mascotaId))
    .limit(1);

  if (!m) return;

  const pct =
    input.similitud != null
      ? `${Math.round(input.similitud * 100)}%`
      : "alta";

  await registrarEventoCaso({
    mascotaId: input.mascotaId,
    avistamientoId: input.avistamientoId,
    tipo: "COINCIDENCIA_IA",
    titulo: `Posible coincidencia visual (${pct})`,
    detalle: input.detalle,
  });

  await crearNotificacionPrivada({
    userId: m.userId,
    tipo: "COINCIDENCIA_IA",
    prioridad: "ALTA",
    titulo: `Posible coincidencia con ${m.nombre}`,
    cuerpo: input.detalle ?? "La IA detectó similitud en una foto reciente.",
    enlace: `/mis-mascotas/${input.mascotaId}/caso`,
    mascotaId: input.mascotaId,
    avistamientoId: input.avistamientoId,
    grupoClave: `ia:${input.mascotaId}:${input.avistamientoId ?? "busqueda"}`,
  });
}

export async function notificarAdministradoresAbuso(input: {
  avistamientoId: string;
  mascotaId: string | null;
  motivo: string;
  reportadoPorNombre: string;
}) {
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.rol, "ADMINISTRADOR"));

  for (const admin of admins) {
    await crearNotificacionPrivada({
      userId: admin.id,
      tipo: "REPORTE_ABUSO_ADMIN",
      prioridad: "ALTA",
      titulo: "Reporte de contenido sospechoso",
      cuerpo: `${input.reportadoPorNombre}: ${input.motivo.slice(0, 120)}`,
      enlace: "/admin",
      avistamientoId: input.avistamientoId,
      mascotaId: input.mascotaId ?? undefined,
      grupoClave: `abuso:${input.avistamientoId}`,
    });
  }
}
