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

/** CIUDADANO = miembro de la comunidad. DUENO queda en el enum solo por compatibilidad. */
export const rolEnum = pgEnum("rol", [
  "CIUDADANO",
  "DUENO",
  "ADMINISTRADOR",
]);

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

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  rol: rolEnum("rol").default("CIUDADANO").notNull(),
  bienvenidaCompletada: boolean("bienvenida_completada").default(true).notNull(),
  telefono: text("telefono"),
  ciudad: text("ciudad"),
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
  microchip: text("microchip"),
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
    modelo: text("modelo")
      .notNull()
      .default("openai/clip-vit-base-patch32"),
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
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

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
  microchip?: string;
  contactoPublico?: string;
  enfermedades?: string;
  accesoExterior?: string;
};
