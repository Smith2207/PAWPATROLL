"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens, type RolUsuario } from "@/lib/db/schema";
import { enviarCorreoVerificacion } from "@/lib/email/enviarVerificacion";
import { randomBytes } from "crypto";

export type ResultadoAuth =
  | { ok: true; mensaje: string }
  | { ok: false; error: string };

const ROLES_REGISTRO: RolUsuario[] = ["CIUDADANO", "DUENO"];

export async function registrarUsuario(datos: {
  nombre: string;
  email: string;
  password: string;
  rol: RolUsuario;
}): Promise<ResultadoAuth> {
  const nombre = datos.nombre.trim();
  const email = datos.email.trim().toLowerCase();
  const password = datos.password;

  if (!nombre || !email || !password) {
    return { ok: false, error: "Completa todos los campos obligatorios." };
  }

  if (password.length < 8) {
    return {
      ok: false,
      error: "La contraseña debe tener al menos 8 caracteres.",
    };
  }

  if (!ROLES_REGISTRO.includes(datos.rol)) {
    return { ok: false, error: "Rol no válido para registro." };
  }

  const [existente] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existente) {
    return { ok: false, error: "Ya existe una cuenta con ese correo." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    name: nombre,
    email,
    passwordHash,
    rol: datos.rol,
    emailVerified: null,
  });

  const token = randomBytes(32).toString("hex");
  const expira = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires: expira,
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const enlace = `${baseUrl}/api/auth/verificar-correo?token=${token}&email=${encodeURIComponent(email)}`;

  await enviarCorreoVerificacion(email, enlace);

  return {
    ok: true,
    mensaje:
      "Cuenta creada. Revisa tu correo y haz clic en el enlace de verificación antes de iniciar sesión.",
  };
}

export async function verificarCorreoConToken(
  email: string,
  token: string
): Promise<ResultadoAuth> {
  const correo = email.trim().toLowerCase();

  const [registro] = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.identifier, correo))
    .limit(1);

  if (!registro || registro.token !== token) {
    return { ok: false, error: "Enlace de verificación inválido." };
  }

  if (registro.expires < new Date()) {
    return { ok: false, error: "El enlace ha expirado. Regístrate de nuevo." };
  }

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, correo));

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, correo));

  return {
    ok: true,
    mensaje: "Correo verificado correctamente. Ya puedes iniciar sesión.",
  };
}

export async function actualizarPerfil(datos: {
  nombre: string;
}): Promise<ResultadoAuth> {
  const { auth } = await import("@/auth");
  const sesion = await auth();

  if (!sesion?.user?.id) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const nombre = datos.nombre.trim();
  if (!nombre) {
    return { ok: false, error: "El nombre no puede estar vacío." };
  }

  await db
    .update(users)
    .set({ name: nombre })
    .where(eq(users.id, sesion.user.id));

  return { ok: true, mensaje: "Perfil actualizado." };
}
