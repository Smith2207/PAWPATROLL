/**
 * Autenticación y autorización: recuperar-contrasena.
 */
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { normalizarCorreo } from "@/lib/auth/admin";
import { urlBaseApp } from "@/lib/email/verificacion";

export const IDENTIFICADOR_RESET_PREFIX = "reset-password:";

const HORAS_VALIDEZ = 1;

export function identificadorTokenReset(email: string) {
  return `${IDENTIFICADOR_RESET_PREFIX}${normalizarCorreo(email)}`;
}

export function enlaceRestablecerContrasena(email: string, token: string) {
  const base = urlBaseApp();
  return `${base}/restablecer-contrasena?email=${encodeURIComponent(normalizarCorreo(email))}&token=${token}`;
}

export async function guardarTokenRecuperacion(email: string) {
  const correo = normalizarCorreo(email);
  const identifier = identificadorTokenReset(correo);
  const token = randomBytes(32).toString("hex");
  const expira = new Date(Date.now() + HORAS_VALIDEZ * 60 * 60 * 1000);

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, identifier));

  await db.insert(verificationTokens).values({
    identifier,
    token,
    expires: expira,
  });

  return { token, enlace: enlaceRestablecerContrasena(correo, token) };
}

export type ResultadoValidacionReset =
  | { ok: true; userId: string }
  | {
      ok: false;
      error: string;
      codigo: "PARAMETROS_INVALIDOS" | "TOKEN_INVALIDO" | "TOKEN_EXPIRADO";
    };

export async function validarTokenRecuperacion(
  email: string,
  token: string
): Promise<ResultadoValidacionReset> {
  const correo = normalizarCorreo(email?.trim() ?? "");
  const tokenLimpio = token?.trim() ?? "";

  if (!correo || !tokenLimpio) {
    return {
      ok: false,
      error: "Enlace incompleto. Solicita uno nuevo.",
      codigo: "PARAMETROS_INVALIDOS",
    };
  }

  const identifier = identificadorTokenReset(correo);

  const [registro] = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.identifier, identifier))
    .limit(1);

  if (!registro || registro.token !== tokenLimpio) {
    return {
      ok: false,
      error: "El enlace no es válido o ya fue usado.",
      codigo: "TOKEN_INVALIDO",
    };
  }

  if (registro.expires < new Date()) {
    return {
      ok: false,
      error: "El enlace expiró. Solicita recuperar la contraseña otra vez.",
      codigo: "TOKEN_EXPIRADO",
    };
  }

  const [usuario] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, correo))
    .limit(1);

  if (!usuario) {
    return {
      ok: false,
      error: "El enlace no es válido o ya fue usado.",
      codigo: "TOKEN_INVALIDO",
    };
  }

  return { ok: true, userId: usuario.id };
}

export async function eliminarTokenRecuperacion(email: string) {
  const identifier = identificadorTokenReset(email);
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, identifier));
}
