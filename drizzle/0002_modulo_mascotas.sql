DO $$ BEGIN
  CREATE TYPE "public"."estado_mascota" AS ENUM('EN_CASA', 'PERDIDA', 'ENCONTRADA', 'REUNIDA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "mascota" ADD COLUMN IF NOT EXISTS "slug" text;
ALTER TABLE "mascota" ADD COLUMN IF NOT EXISTS "tamano" text;
ALTER TABLE "mascota" ADD COLUMN IF NOT EXISTS "edad" text;
ALTER TABLE "mascota" ADD COLUMN IF NOT EXISTS "peso" text;
ALTER TABLE "mascota" ADD COLUMN IF NOT EXISTS "descripcion" text;
ALTER TABLE "mascota" ADD COLUMN IF NOT EXISTS "senas_particulares" text;
ALTER TABLE "mascota" ADD COLUMN IF NOT EXISTS "collar" text;
ALTER TABLE "mascota" ADD COLUMN IF NOT EXISTS "microchip" text;
ALTER TABLE "mascota" ADD COLUMN IF NOT EXISTS "estado" "estado_mascota" DEFAULT 'EN_CASA' NOT NULL;
ALTER TABLE "mascota" ADD COLUMN IF NOT EXISTS "fecha_perdida" timestamp;
ALTER TABLE "mascota" ADD COLUMN IF NOT EXISTS "lugar_perdida" text;
ALTER TABLE "mascota" ADD COLUMN IF NOT EXISTS "contacto_publico" text;
ALTER TABLE "mascota" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

UPDATE "mascota" SET "slug" = 'mascota-' || substr(id, 1, 8) WHERE "slug" IS NULL;
ALTER TABLE "mascota" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "mascota_slug_unique" ON "mascota" ("slug");

CREATE TABLE IF NOT EXISTS "mascota_foto" (
  "id" text PRIMARY KEY NOT NULL,
  "mascota_id" text NOT NULL REFERENCES "mascota"("id") ON DELETE cascade,
  "url" text NOT NULL,
  "es_principal" boolean DEFAULT false NOT NULL,
  "orden" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "historial_estado_mascota" (
  "id" text PRIMARY KEY NOT NULL,
  "mascota_id" text NOT NULL REFERENCES "mascota"("id") ON DELETE cascade,
  "estado_anterior" "estado_mascota" NOT NULL,
  "estado_nuevo" "estado_mascota" NOT NULL,
  "notas" text,
  "user_id" text REFERENCES "user"("id") ON DELETE set null,
  "created_at" timestamp DEFAULT now() NOT NULL
);
