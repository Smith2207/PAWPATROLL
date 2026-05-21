"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  esCorreoAdmin,
  normalizarCorreo,
  rolParaNuevoUsuario,
} from "@/lib/auth/admin";
import { verificarCuentaConToken } from "@/lib/auth/verificar-cuenta";
import { enviarCorreoBienvenida } from "@/lib/email/enviarBienvenida";
import {
  enviarVerificacionCuenta,
  usuarioPendienteVerificacion,
} from "@/lib/email/verificacion";

export type ResultadoAuth =
  | { ok: true; mensaje: string }
  | { ok: false; error: string };

function mensajeCorreoVerificacion(enviado: boolean, error?: string) {
  if (enviado) {
    return "Te enviamos un correo desde paw.patrol.soporte@gmail.com. Abre el enlace para activar tu cuenta (revisa también spam).";
  }
  if (error) {
    return `Cuenta creada, pero no se pudo enviar el correo: ${error}. Puedes reenviarlo desde la página de verificación.`;
  }
  return "Cuenta creada. Configura SMTP en .env.local para recibir el correo; el enlace también aparece en la consola del servidor.";
}

export async function registrarUsuario(datos: {
  nombre: string;
  email: string;
  password: string;
}): Promise<ResultadoAuth> {
  const nombre = datos.nombre.trim();
  const email = normalizarCorreo(datos.email);
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

  const [existente] = await db
    .select({ id: users.id, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existente) {
    if (!existente.emailVerified) {
      const { enviado, error } = await enviarVerificacionCuenta(email, nombre);
      return {
        ok: true,
        mensaje: enviado
          ? "Ya existía una cuenta sin verificar. Te reenviamos el correo de verificación."
          : mensajeCorreoVerificacion(false, error),
      };
    }
    return { ok: false, error: "Ya existe una cuenta con ese correo." };
  }

  const rol = rolParaNuevoUsuario(email);
  const esAdmin = esCorreoAdmin(email);
  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    name: nombre,
    email,
    passwordHash,
    rol,
    emailVerified: esAdmin ? new Date() : null,
  });

  if (esAdmin) {
    await enviarCorreoBienvenida(email, nombre, rol);
    return {
      ok: true,
      mensaje:
        "Cuenta de administrador creada. Revisa tu correo de bienvenida.",
    };
  }

  const { enviado, error } = await enviarVerificacionCuenta(email, nombre);

  return {
    ok: true,
    mensaje: mensajeCorreoVerificacion(enviado, error),
  };
}

export async function reenviarCorreoVerificacion(
  email: string
): Promise<ResultadoAuth> {
  const correo = normalizarCorreo(email?.trim() ?? "");

  if (!correo) {
    return { ok: false, error: "Indica tu correo electrónico." };
  }

  const estado = await usuarioPendienteVerificacion(correo);

  if (!estado.ok) {
    return { ok: false, error: estado.error };
  }

  const { enviado, error } = await enviarVerificacionCuenta(
    correo,
    estado.nombre
  );

  if (!enviado) {
    return {
      ok: false,
      error: error ?? "No se pudo enviar el correo. Revisa SMTP en .env.local.",
    };
  }

  return {
    ok: true,
    mensaje:
      "Correo de verificación enviado. Revisa tu bandeja y la carpeta de spam.",
  };
}

export async function verificarCorreoConToken(
  email: string,
  token: string
): Promise<ResultadoAuth> {
  const resultado = await verificarCuentaConToken(email, token);

  if (!resultado.ok) {
    return { ok: false, error: resultado.error };
  }

  return {
    ok: true,
    mensaje:
      "Correo verificado. Te enviamos un mensaje de bienvenida. Ya puedes iniciar sesión.",
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
