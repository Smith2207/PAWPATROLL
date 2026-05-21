import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { normalizarCorreo } from "@/lib/auth/admin";
import { enviarCorreoBienvenida } from "@/lib/email/enviarBienvenida";

export type ResultadoVerificacion =
  | {
      ok: true;
      mensaje: string;
      email: string;
      verificado: true;
    }
  | {
      ok: false;
      error: string;
      codigo:
        | "PARAMETROS_INVALIDOS"
        | "TOKEN_INVALIDO"
        | "TOKEN_EXPIRADO"
        | "USUARIO_NO_ENCONTRADO"
        | "YA_VERIFICADO";
    };

export async function verificarCuentaConToken(
  email: string,
  token: string
): Promise<ResultadoVerificacion> {
  const correo = normalizarCorreo(email?.trim() ?? "");
  const tokenLimpio = token?.trim() ?? "";

  if (!correo || !tokenLimpio) {
    return {
      ok: false,
      error: "Faltan correo o token.",
      codigo: "PARAMETROS_INVALIDOS",
    };
  }

  const [usuario] = await db
    .select({
      id: users.id,
      name: users.name,
      rol: users.rol,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.email, correo))
    .limit(1);

  if (!usuario) {
    return {
      ok: false,
      error: "No hay cuenta con ese correo.",
      codigo: "USUARIO_NO_ENCONTRADO",
    };
  }

  if (usuario.emailVerified) {
    return {
      ok: false,
      error: "Esta cuenta ya está verificada.",
      codigo: "YA_VERIFICADO",
    };
  }

  const [registro] = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.identifier, correo))
    .limit(1);

  if (!registro || registro.token !== tokenLimpio) {
    return {
      ok: false,
      error: "Token de verificación inválido.",
      codigo: "TOKEN_INVALIDO",
    };
  }

  if (registro.expires < new Date()) {
    return {
      ok: false,
      error: "El token expiró. Solicita un nuevo correo de verificación.",
      codigo: "TOKEN_EXPIRADO",
    };
  }

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, correo));

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, correo));

  await enviarCorreoBienvenida(correo, usuario.name ?? "", usuario.rol);

  return {
    ok: true,
    mensaje: "Cuenta verificada correctamente.",
    email: correo,
    verificado: true,
  };
}

export async function consultarEstadoVerificacion(email: string) {
  const correo = normalizarCorreo(email?.trim() ?? "");

  if (!correo) {
    return { ok: false as const, error: "Correo requerido." };
  }

  const [usuario] = await db
    .select({
      emailVerified: users.emailVerified,
      rol: users.rol,
    })
    .from(users)
    .where(eq(users.email, correo))
    .limit(1);

  if (!usuario) {
    return { ok: false as const, error: "Usuario no encontrado." };
  }

  return {
    ok: true as const,
    email: correo,
    verificado: Boolean(usuario.emailVerified),
    rol: usuario.rol,
  };
}
