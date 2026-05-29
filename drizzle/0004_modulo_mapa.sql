ALTER TABLE "mascota" ADD COLUMN IF NOT EXISTS "lat_perdida" text;
ALTER TABLE "mascota" ADD COLUMN IF NOT EXISTS "lng_perdida" text;
ALTER TABLE "mascota" ADD COLUMN IF NOT EXISTS "radio_busqueda_metros" integer;

CREATE TABLE IF NOT EXISTS "avistamiento" (
  "id" text PRIMARY KEY NOT NULL,
  "mascota_id" text REFERENCES "mascota"("id") ON DELETE SET NULL,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "numero_reporte" integer NOT NULL,
  "lat" text NOT NULL,
  "lng" text NOT NULL,
  "direccion" text,
  "tipo_mascota" text,
  "tamano" text,
  "color" text,
  "raza" text,
  "referencias" text,
  "direccion_movimiento" text,
  "descripcion" text,
  "foto_url" text,
  "nombre_reportante" text,
  "telefono_reportante" text,
  "en_tiempo_real" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
