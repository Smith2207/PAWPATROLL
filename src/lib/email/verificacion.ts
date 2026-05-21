import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { normalizarCorreo } from "@/lib/auth/admin";
import { enviarCorreoVerificacion } from "@/lib/email/enviarVerificacion";

const HORAS_VALIDEZ = 24;

export function urlBaseApp() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function enlaceVerificacionCorreo(email: string, token: string) {
  const base = urlBaseApp();
  return `${base}/api/auth/verificar-correo?token=${token}&email=${encodeURIComponent(email)}`;
}

export async function guardarTokenVerificacion(email: string) {
  const correo = normalizarCorreo(email);
  const token = randomBytes(32).toString("hex");
  const expira = new Date(Date.now() + HORAS_VALIDEZ * 60 * 60 * 1000);

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, correo));

  await db.insert(verificationTokens).values({
    identifier: correo,
    token,
    expires: expira,
  });

  return { token, enlace: enlaceVerificacionCorreo(correo, token) };
}

export async function enviarVerificacionCuenta(
  email: string,
  nombre?: string
): Promise<{ enviado: boolean; error?: string }> {
  const correo = normalizarCorreo(email);
  const { enlace } = await guardarTokenVerificacion(correo);

  try {
    const { enviado, error } = await enviarCorreoVerificacion(
      correo,
      enlace,
      nombre
    );
    return { enviado, error };
  } catch (err) {
    const mensaje =
      err instanceof Error ? err.message : "Error al enviar el correo.";
    console.error("[PawPatrol] Error SMTP verificación:", mensaje);
    return { enviado: false, error: mensaje };
  }
}

export async function usuarioPendienteVerificacion(email: string) {
  const correo = normalizarCorreo(email);

  const [usuario] = await db
    .select({
      id: users.id,
      name: users.name,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.email, correo))
    .limit(1);

  if (!usuario) {
    return { ok: false as const, error: "No hay cuenta con ese correo." };
  }

  if (usuario.emailVerified) {
    return { ok: false as const, error: "Esa cuenta ya está verificada." };
  }

  return { ok: true as const, nombre: usuario.name ?? "" };
}
