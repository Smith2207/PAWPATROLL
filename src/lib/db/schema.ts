/**
 * Esquema Drizzle ORM: tablas, enums y relaciones de PostgreSQL (Neon).
 */
import type { AdapterAccount } from "next-auth/adapters";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** USUARIO = cualquier miembro (reporta, avistamientos, fichas). ADMINISTRADOR = único soporte. */
export const rolEnum = pgEnum("rol", ["USUARIO", "ADMINISTRADOR"]);

export const estadoMascotaEnum = pgEnum("estado_mascota", [
  "EN_CASA",
  "PERDIDA",
  "ENCONTRADA",
  "REUNIDA",
]);

export const estadoAvistamientoEnum = pgEnum("avistamiento_estado", [
  "PENDIENTE",
  "VERIFICADO",
  "DESCARTADO",
]);

export const notificacionTipoEnum = pgEnum("notificacion_tipo", [
  "AVISTAMIENTO_NUEVO",
  "AVISTAMIENTO_VERIFICADO",
  "AVISTAMIENTO_DESCARTADO",
  "MENSAJE_NUEVO",
  "COINCIDENCIA_IA",
  "ESTADO_CASO",
  "CASO_RECUPERADO",
  "REPORTE_ABUSO_ADMIN",
]);

export const prioridadNotificacionEnum = pgEnum("prioridad_notificacion", [
  "ALTA",
  "NORMAL",
  "BAJA",
]);

export const eventoCasoTipoEnum = pgEnum("evento_caso_tipo", [
  "ALERTA_ACTIVADA",
  "AVISTAMIENTO_NUEVO",
  "FOTO_AGREGADA",
  "MENSAJE_ENVIADO",
  "AVISTAMIENTO_VERIFICADO",
  "AVISTAMIENTO_DESCARTADO",
  "COINCIDENCIA_IA",
  "ESTADO_CAMBIADO",
  "MASCOTA_RECUPERADA",
  "REPORTE_ABUSO",
]);

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  rol: rolEnum("rol").default("USUARIO").notNull(),
  bienvenidaCompletada: boolean("bienvenida_completada").default(true).notNull(),
  telefono: text("telefono"),
  ciudad: text("ciudad"),
  notificacionesEmail: boolean("notificaciones_email").default(true).notNull(),
  notificacionesInApp: boolean("notificaciones_in_app").default(true).notNull(),
  activo: boolean("activo").default(true).notNull(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compoundKey: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
);

export const mascotas = pgTable("mascota", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  /** Dueño de la ficha (mascota.user_id; no es un rol de cuenta en user.rol). */
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  nombre: text("nombre").notNull(),
  tipo: text("tipo").notNull(),
  raza: text("raza"),
  sexo: text("sexo"),
  color: text("color"),
  tamano: text("tamano"),
  edad: text("edad"),
  peso: text("peso"),
  descripcion: text("descripcion"),
  senasParticulares: text("senas_particulares"),
  collar: text("collar"),
  estado: estadoMascotaEnum("estado").default("EN_CASA").notNull(),
  fechaPerdida: timestamp("fecha_perdida", { mode: "date" }),
  lugarPerdida: text("lugar_perdida"),
  latPerdida: text("lat_perdida"),
  lngPerdida: text("lng_perdida"),
  radioBusquedaMetros: integer("radio_busqueda_metros"),
  /** solo_interior | patio_supervisado | exterior_habitual */
  accesoExterior: text("acceso_exterior"),
  contactoPublico: text("contacto_publico"),
  enfermedades: text("enfermedades"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const mascotaFotos = pgTable("mascota_foto", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  mascotaId: text("mascota_id")
    .notNull()
    .references(() => mascotas.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  esPrincipal: boolean("es_principal").default(false).notNull(),
  orden: integer("orden").default(0).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

/** Un embedding CLIP por foto de mascota perdida */
export const mascotaEmbeddings = pgTable(
  "mascota_embedding",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    mascotaId: text("mascota_id")
      .notNull()
      .references(() => mascotas.id, { onDelete: "cascade" }),
    fotoId: text("foto_id")
      .notNull()
      .references(() => mascotaFotos.id, { onDelete: "cascade" }),
    embedding: text("embedding").notNull(),
    descripcionAi: text("descripcion_ai"),
    modelo: text("modelo")
      .notNull()
      .default("gemini-embedding-2-preview"),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    mascotaFotoUnico: uniqueIndex("mascota_embedding_mascota_foto_uidx").on(
      table.mascotaId,
      table.fotoId
    ),
  })
);

export const avistamientos = pgTable("avistamiento", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  mascotaId: text("mascota_id").references(() => mascotas.id, {
    onDelete: "set null",
  }),
  /** Usuario que reportó el avistamiento (testigo en el chat; no es un rol de cuenta). */
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  /** Número secuencial de avistamiento para la mascota (1, 2, 3…) */
  numeroReporte: integer("numero_reporte").notNull(),
  lat: text("lat").notNull(),
  lng: text("lng").notNull(),
  direccion: text("direccion"),
  tipoMascota: text("tipo_mascota"),
  tamano: text("tamano"),
  color: text("color"),
  raza: text("raza"),
  referencias: text("referencias"),
  direccionMovimiento: text("direccion_movimiento"),
  descripcion: text("descripcion"),
  fotoUrl: text("foto_url"),
  nombreReportante: text("nombre_reportante"),
  telefonoReportante: text("telefono_reportante"),
  enTiempoReal: boolean("en_tiempo_real").default(false).notNull(),
  estado: estadoAvistamientoEnum("estado").default("PENDIENTE").notNull(),
  verificadoPor: text("verificado_por").references(() => users.id, {
    onDelete: "set null",
  }),
  verificadoAt: timestamp("verificado_at", { mode: "date" }),
  motivoDescarte: text("motivo_descarte"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const mensajesAvistamiento = pgTable("mensaje_avistamiento", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  avistamientoId: text("avistamiento_id")
    .notNull()
    .references(() => avistamientos.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  autorNombre: text("autor_nombre"),
  contenido: text("contenido").notNull(),
  adjuntoUrl: text("adjunto_url"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const notificaciones = pgTable("notificacion", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mascotaId: text("mascota_id").references(() => mascotas.id, {
    onDelete: "cascade",
  }),
  avistamientoId: text("avistamiento_id").references(() => avistamientos.id, {
    onDelete: "cascade",
  }),
  tipo: notificacionTipoEnum("tipo").notNull(),
  prioridad: prioridadNotificacionEnum("prioridad").default("NORMAL").notNull(),
  titulo: text("titulo").notNull(),
  cuerpo: text("cuerpo"),
  enlace: text("enlace"),
  grupoClave: text("grupo_clave"),
  leidaAt: timestamp("leida_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const eventosCaso = pgTable("evento_caso", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  mascotaId: text("mascota_id")
    .notNull()
    .references(() => mascotas.id, { onDelete: "cascade" }),
  avistamientoId: text("avistamiento_id").references(() => avistamientos.id, {
    onDelete: "set null",
  }),
  tipo: eventoCasoTipoEnum("tipo").notNull(),
  titulo: text("titulo").notNull(),
  detalle: text("detalle"),
  actorUserId: text("actor_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  metadata: text("metadata"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const reportesAbuso = pgTable("reporte_abuso", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  avistamientoId: text("avistamiento_id")
    .notNull()
    .references(() => avistamientos.id, { onDelete: "cascade" }),
  reportadoPor: text("reportado_por")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  motivo: text("motivo").notNull(),
  estado: text("estado").default("PENDIENTE").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const lecturasChat = pgTable(
  "lectura_chat",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    avistamientoId: text("avistamiento_id")
      .notNull()
      .references(() => avistamientos.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ultimoLeidoAt: timestamp("ultimo_leido_at", { mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    avistamientoUserUnico: uniqueIndex("lectura_chat_avistamiento_user_uidx").on(
      table.avistamientoId,
      table.userId
    ),
  })
);

export const historialEstadoMascota = pgTable("historial_estado_mascota", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  mascotaId: text("mascota_id")
    .notNull()
    .references(() => mascotas.id, { onDelete: "cascade" }),
  estadoAnterior: estadoMascotaEnum("estado_anterior").notNull(),
  estadoNuevo: estadoMascotaEnum("estado_nuevo").notNull(),
  notas: text("notas"),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export type RolUsuario = (typeof rolEnum.enumValues)[number];
export type EstadoMascota = (typeof estadoMascotaEnum.enumValues)[number];
export type Usuario = typeof users.$inferSelect;
export type Mascota = typeof mascotas.$inferSelect;
export type MascotaFoto = typeof mascotaFotos.$inferSelect;
export type HistorialEstadoMascota = typeof historialEstadoMascota.$inferSelect;
export type Avistamiento = typeof avistamientos.$inferSelect;
export type EstadoAvistamiento =
  (typeof estadoAvistamientoEnum.enumValues)[number];
export type MensajeAvistamiento = typeof mensajesAvistamiento.$inferSelect;
export type Notificacion = typeof notificaciones.$inferSelect;
export type NotificacionTipo = (typeof notificacionTipoEnum.enumValues)[number];
export type PrioridadNotificacion =
  (typeof prioridadNotificacionEnum.enumValues)[number];
export type EventoCaso = typeof eventosCaso.$inferSelect;
export type EventoCasoTipo = (typeof eventoCasoTipoEnum.enumValues)[number];
export type ReporteAbuso = typeof reportesAbuso.$inferSelect;
export type DatosFichaMascota = {
  nombre: string;
  tipo: string;
  raza?: string;
  sexo?: string;
  color?: string;
  tamano?: string;
  edad?: string;
  peso?: string;
  descripcion?: string;
  senasParticulares?: string;
  collar?: string;
  contactoPublico?: string;
  enfermedades?: string;
  accesoExterior?: string;
};
