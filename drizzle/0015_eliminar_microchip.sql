-- Elimina el campo microchip de la ficha de mascota (ya no se usa en la app).
ALTER TABLE "mascota" DROP COLUMN IF EXISTS "microchip";
