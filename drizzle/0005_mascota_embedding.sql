CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "mascota_embedding" (
  "mascota_id" text PRIMARY KEY NOT NULL REFERENCES "mascota"("id") ON DELETE CASCADE,
  "embedding" text NOT NULL,
  "modelo" text NOT NULL DEFAULT 'openai/clip-vit-base-patch32',
  "updated_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "mascota_embedding"
  ADD COLUMN IF NOT EXISTS "embedding_vec" vector(512);
