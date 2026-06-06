-- Gemini Embedding 2: vector(768) + descripción generada por Flash
ALTER TABLE "mascota_embedding"
  ADD COLUMN IF NOT EXISTS "descripcion_ai" text;

ALTER TABLE "mascota_embedding" DROP COLUMN IF EXISTS "embedding_vec";

ALTER TABLE "mascota_embedding"
  ADD COLUMN "embedding_vec" vector(768);
