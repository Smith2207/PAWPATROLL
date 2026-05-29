-- Ejecutar en Neon SQL Editor o con: npm run db:push

CREATE TYPE "public"."rol" AS ENUM('CIUDADANO', 'DUENO', 'ADMINISTRADOR');

CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text,
  "email" text NOT NULL UNIQUE,
  "emailVerified" timestamp,
  "image" text,
  "password_hash" text,
  "rol" "rol" DEFAULT 'CIUDADANO' NOT NULL
);

CREATE TABLE IF NOT EXISTS "account" (
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "provider" text NOT NULL,
  "providerAccountId" text NOT NULL,
  "refresh_token" text,
  "access_token" text,
  "expires_at" integer,
  "token_type" text,
  "scope" text,
  "id_token" text,
  "session_state" text,
  PRIMARY KEY ("provider", "providerAccountId")
);

CREATE TABLE IF NOT EXISTS "session" (
  "sessionToken" text PRIMARY KEY NOT NULL,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "expires" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "verificationToken" (
  "identifier" text NOT NULL,
  "token" text NOT NULL,
  "expires" timestamp NOT NULL,
  PRIMARY KEY ("identifier", "token")
);

CREATE TABLE IF NOT EXISTS "mascota" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "nombre" text NOT NULL,
  "tipo" text NOT NULL,
  "raza" text,
  "sexo" text,
  "color" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Único administrador (automático al registrarse con este correo):
-- paw.patrol.soporte@gmail.com
