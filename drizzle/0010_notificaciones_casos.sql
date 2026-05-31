CREATE TYPE "notificacion_tipo" AS ENUM(
  'AVISTAMIENTO_NUEVO',
  'AVISTAMIENTO_VERIFICADO',
  'AVISTAMIENTO_DESCARTADO',
  'MENSAJE_NUEVO',
  'COINCIDENCIA_IA',
  'ESTADO_CASO',
  'CASO_RECUPERADO',
  'REPORTE_ABUSO_ADMIN'
);

CREATE TYPE "prioridad_notificacion" AS ENUM('ALTA', 'NORMAL', 'BAJA');

CREATE TYPE "evento_caso_tipo" AS ENUM(
  'ALERTA_ACTIVADA',
  'AVISTAMIENTO_NUEVO',
  'FOTO_AGREGADA',
  'MENSAJE_ENVIADO',
  'AVISTAMIENTO_VERIFICADO',
  'AVISTAMIENTO_DESCARTADO',
  'COINCIDENCIA_IA',
  'ESTADO_CAMBIADO',
  'MASCOTA_RECUPERADA'
);

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS notificaciones_email boolean DEFAULT true NOT NULL;

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS notificaciones_in_app boolean DEFAULT true NOT NULL;

CREATE TABLE IF NOT EXISTS "notificacion" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "mascota_id" text REFERENCES "mascota"("id") ON DELETE CASCADE,
  "avistamiento_id" text REFERENCES "avistamiento"("id") ON DELETE CASCADE,
  "tipo" "notificacion_tipo" NOT NULL,
  "prioridad" "prioridad_notificacion" DEFAULT 'NORMAL' NOT NULL,
  "titulo" text NOT NULL,
  "cuerpo" text,
  "enlace" text,
  "grupo_clave" text,
  "leida_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "notificacion_user_idx"
  ON "notificacion" ("user_id", "leida_at", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "notificacion_grupo_idx"
  ON "notificacion" ("user_id", "grupo_clave", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "evento_caso" (
  "id" text PRIMARY KEY NOT NULL,
  "mascota_id" text NOT NULL REFERENCES "mascota"("id") ON DELETE CASCADE,
  "avistamiento_id" text REFERENCES "avistamiento"("id") ON DELETE SET NULL,
  "tipo" "evento_caso_tipo" NOT NULL,
  "titulo" text NOT NULL,
  "detalle" text,
  "actor_user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "metadata" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "evento_caso_mascota_idx"
  ON "evento_caso" ("mascota_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "reporte_abuso" (
  "id" text PRIMARY KEY NOT NULL,
  "avistamiento_id" text NOT NULL REFERENCES "avistamiento"("id") ON DELETE CASCADE,
  "reportado_por" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "motivo" text NOT NULL,
  "estado" text DEFAULT 'PENDIENTE' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "lectura_chat" (
  "id" text PRIMARY KEY NOT NULL,
  "avistamiento_id" text NOT NULL REFERENCES "avistamiento"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "ultimo_leido_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "lectura_chat_avistamiento_user_uidx" UNIQUE ("avistamiento_id", "user_id")
);
