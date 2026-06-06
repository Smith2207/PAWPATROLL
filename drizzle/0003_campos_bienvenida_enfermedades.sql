ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "bienvenida_completada" boolean NOT NULL DEFAULT true;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "telefono" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ciudad" text;
ALTER TABLE "mascota" ADD COLUMN IF NOT EXISTS "enfermedades" text;
