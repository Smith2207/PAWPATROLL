-- Migración 0014: integridad de reportes, historial de estados, evento de abuso

-- Número de reporte único por mascota (reportes del mapa sin mascota quedan fuera)
CREATE UNIQUE INDEX IF NOT EXISTS "avistamiento_mascota_numero_uidx"
  ON "avistamiento" ("mascota_id", "numero_reporte")
  WHERE "mascota_id" IS NOT NULL;

-- Tipo de evento para denuncias en el timeline
ALTER TYPE "evento_caso_tipo" ADD VALUE IF NOT EXISTS 'REPORTE_ABUSO';
