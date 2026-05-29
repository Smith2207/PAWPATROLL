-- Varias fotos por mascota (un embedding por foto)
DELETE FROM mascota_embedding;

ALTER TABLE mascota_embedding DROP CONSTRAINT IF EXISTS mascota_embedding_pkey;

ALTER TABLE mascota_embedding ADD COLUMN IF NOT EXISTS id text;
ALTER TABLE mascota_embedding ADD COLUMN IF NOT EXISTS foto_id text;

ALTER TABLE mascota_embedding
  ADD CONSTRAINT mascota_embedding_foto_id_fkey
  FOREIGN KEY (foto_id) REFERENCES mascota_foto(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS mascota_embedding_mascota_foto_uidx
  ON mascota_embedding (mascota_id, foto_id);

ALTER TABLE mascota_embedding ADD PRIMARY KEY (id);
