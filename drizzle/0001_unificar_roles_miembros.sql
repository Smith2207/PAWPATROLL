-- Unifica cuentas antiguas "Dueño" al rol estándar de miembro (CIUDADANO).
UPDATE "user" SET rol = 'CIUDADANO' WHERE rol = 'DUENO';
