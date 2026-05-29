CREATE TYPE "avistamiento_estado" AS ENUM ('PENDIENTE', 'VERIFICADO', 'DESCARTADO');

ALTER TABLE "avistamiento" ADD COLUMN IF NOT EXISTS "estado" "avistamiento_estado" DEFAULT 'PENDIENTE' NOT NULL;
ALTER TABLE "avistamiento" ADD COLUMN IF NOT EXISTS "verificado_por" text REFERENCES "user"("id") ON DELETE SET NULL;
ALTER TABLE "avistamiento" ADD COLUMN IF NOT EXISTS "verificado_at" timestamp;
ALTER TABLE "avistamiento" ADD COLUMN IF NOT EXISTS "motivo_descarte" text;

CREATE TABLE IF NOT EXISTS "mensaje_avistamiento" (
  "id" text PRIMARY KEY NOT NULL,
  "avistamiento_id" text NOT NULL REFERENCES "avistamiento"("id") ON DELETE CASCADE,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "autor_nombre" text,
  "contenido" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "mensaje_avistamiento_avistamiento_id_idx" ON "mensaje_avistamiento" ("avistamiento_id");
