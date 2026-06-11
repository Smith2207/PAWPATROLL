-- Simplifica roles: solo USUARIO (comunidad) y ADMINISTRADOR (soporte).
-- Migra CIUDADANO y DUENO legacy → USUARIO.

CREATE TYPE "public"."rol_nuevo" AS ENUM('USUARIO', 'ADMINISTRADOR');

ALTER TABLE "user" ALTER COLUMN "rol" DROP DEFAULT;

ALTER TABLE "user"
  ALTER COLUMN "rol" TYPE "public"."rol_nuevo"
  USING (
    CASE
      WHEN "rol"::text = 'ADMINISTRADOR' THEN 'ADMINISTRADOR'::"public"."rol_nuevo"
      ELSE 'USUARIO'::"public"."rol_nuevo"
    END
  );

DROP TYPE "public"."rol";

ALTER TYPE "public"."rol_nuevo" RENAME TO "rol";

ALTER TABLE "user" ALTER COLUMN "rol" SET DEFAULT 'USUARIO'::"public"."rol";
