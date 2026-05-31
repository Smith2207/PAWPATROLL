"use server";

import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts, sessions, users } from "@/lib/db/schema";
import { esCorreoValido } from "@/lib/auth/validacion-correo";
import {
  esCorreoAdmin,
  normalizarCorreo,
  rolParaNuevoUsuario,
} from "@/lib/auth/admin";
import {
  eliminarTokenRecuperacion,
  guardarTokenRecuperacion,
  validarTokenRecuperacion,
} from "@/lib/auth/recuperar-contrasena";
import { verificarCuentaConToken } from "@/lib/auth/verificar-cuenta";
import { enviarCorreoRecuperacion } from "@/lib/email/enviarRecuperacion";
import { enviarCorreoBienvenida } from "@/lib/email/enviarBienvenida";
import {
  enviarVerificacionCuenta,
  usuarioPendienteVerificacion,
} from "@/lib/email/verificacion";
import { validarImagenDataUrl } from "@/lib/auth/validacion-imagen";

export type ResultadoAuth =
  | { ok: true; mensaje: string }
  | { ok: false; error: string };

function mensajeCorreoVerificacion(enviado: boolean, error?: string) {
  if (enviado) {
    return "Te enviamos un correo desde paw.patrol.soporte@gmail.com. Haz clic en el botón del mensaje para activar tu cuenta (revisa también spam).";
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

  if (!esCorreoValido(email)) {
    return { ok: false, error: "Escribe un correo válido, por ejemplo: nombre@ejemplo.com" };
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
    bienvenidaCompletada: esAdmin,
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

const MENSAJE_RECUPERACION_ENVIADA =
  "Si existe una cuenta con ese correo y contraseña, te enviamos un correo con un botón para restablecerla (revisa también spam). El acceso vale 1 hora.";

export async function solicitarRecuperacionContrasena(
  email: string
): Promise<ResultadoAuth> {
  const correo = normalizarCorreo(email?.trim() ?? "");

  if (!correo) {
    return { ok: false, error: "Indica tu correo electrónico." };
  }

  const [usuario] = await db
    .select({
      name: users.name,
      passwordHash: users.passwordHash,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.email, correo))
    .limit(1);

  if (
    !usuario?.passwordHash ||
    !usuario.emailVerified
  ) {
    return { ok: true, mensaje: MENSAJE_RECUPERACION_ENVIADA };
  }

  const { enlace } = await guardarTokenRecuperacion(correo);
  const { enviado, error } = await enviarCorreoRecuperacion(
    correo,
    enlace,
    usuario.name ?? undefined
  );

  if (!enviado) {
    console.info("[PawPatrol] Enlace recuperación (consola):", enlace);
    return {
      ok: true,
      mensaje: error
        ? `${MENSAJE_RECUPERACION_ENVIADA} (aviso: ${error})`
        : `${MENSAJE_RECUPERACION_ENVIADA} En desarrollo, el enlace también está en la consola del servidor.`,
    };
  }

  return { ok: true, mensaje: MENSAJE_RECUPERACION_ENVIADA };
}

export async function restablecerContrasenaConToken(datos: {
  email: string;
  token: string;
  password: string;
}): Promise<ResultadoAuth> {
  const correo = normalizarCorreo(datos.email?.trim() ?? "");
  const token = datos.token?.trim() ?? "";
  const password = datos.password ?? "";

  if (!correo || !token) {
    return { ok: false, error: "Enlace inválido. Solicita recuperar la contraseña de nuevo." };
  }

  if (password.length < 8) {
    return {
      ok: false,
      error: "La contraseña debe tener al menos 8 caracteres.",
    };
  }

  const validacion = await validarTokenRecuperacion(correo, token);
  if (!validacion.ok) {
    return { ok: false, error: validacion.error };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, validacion.userId));

  await eliminarTokenRecuperacion(correo);

  await db.delete(sessions).where(eq(sessions.userId, validacion.userId));

  return {
    ok: true,
    mensaje:
      "Contraseña actualizada. Ya puedes iniciar sesión con tu nueva contraseña.",
  };
}

export async function cambiarContrasenaSesion(datos: {
  contrasenaActual: string;
  password: string;
}): Promise<ResultadoAuth> {
  const { auth } = await import("@/auth");
  const sesion = await auth();

  if (!sesion?.user?.id) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const contrasenaActual = datos.contrasenaActual ?? "";
  const password = datos.password ?? "";

  if (!contrasenaActual) {
    return { ok: false, error: "Indica tu contraseña actual." };
  }

  if (password.length < 8) {
    return {
      ok: false,
      error: "La nueva contraseña debe tener al menos 8 caracteres.",
    };
  }

  const [usuario] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, sesion.user.id))
    .limit(1);

  if (!usuario?.passwordHash) {
    return {
      ok: false,
      error: "Tu cuenta entra con Google; no puedes cambiar contraseña aquí.",
    };
  }

  const coincide = await bcrypt.compare(contrasenaActual, usuario.passwordHash);
  if (!coincide) {
    return { ok: false, error: "La contraseña actual no es correcta." };
  }

  const misma = await bcrypt.compare(password, usuario.passwordHash);
  if (misma) {
    return {
      ok: false,
      error: "La nueva contraseña debe ser distinta a la actual.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, sesion.user.id));

  return { ok: true, mensaje: "Tu contraseña se actualizó correctamente." };
}

export async function actualizarPerfil(datos: {
  nombre: string;
  telefono?: string;
  ciudad?: string;
  notificacionesEmail?: boolean;
  notificacionesInApp?: boolean;
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
    .set({
      name: nombre,
      telefono: datos.telefono?.trim() || null,
      ciudad: datos.ciudad?.trim() || null,
      bienvenidaCompletada: true,
      ...(datos.notificacionesEmail !== undefined && {
        notificacionesEmail: datos.notificacionesEmail,
      }),
      ...(datos.notificacionesInApp !== undefined && {
        notificacionesInApp: datos.notificacionesInApp,
      }),
    })
    .where(eq(users.id, sesion.user.id));

  return { ok: true, mensaje: "Tu perfil se actualizó correctamente." };
}

export async function actualizarImagenPerfil(
  imagen: string | null
): Promise<ResultadoAuth> {
  const { auth } = await import("@/auth");
  const sesion = await auth();

  if (!sesion?.user?.id) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const validacion = validarImagenDataUrl(imagen);
  if (!validacion.ok) {
    return { ok: false, error: validacion.error };
  }

  await db
    .update(users)
    .set({ image: imagen })
    .where(eq(users.id, sesion.user.id));

  return {
    ok: true,
    mensaje: imagen
      ? "Tu foto de perfil se actualizó correctamente."
      : "Se quitó tu foto de perfil.",
  };
}

export type ContactoPerfilUsuario = {
  email: string;
  telefono: string | null;
};

export async function obtenerContactoPerfil(): Promise<ContactoPerfilUsuario | null> {
  const { auth } = await import("@/auth");
  const sesion = await auth();

  if (!sesion?.user?.id) return null;

  const [usuario] = await db
    .select({
      email: users.email,
      telefono: users.telefono,
    })
    .from(users)
    .where(eq(users.id, sesion.user.id))
    .limit(1);

  if (!usuario) return null;

  return {
    email: usuario.email,
    telefono: usuario.telefono,
  };
}

export type DatosPerfilUsuario = {
  id: string;
  nombre: string | null;
  email: string;
  telefono: string | null;
  ciudad: string | null;
  rol: (typeof users.$inferSelect)["rol"];
  imagen: string | null;
  emailVerificado: boolean;
  tieneContrasena: boolean;
  cuentaGoogle: boolean;
  totalMascotas: number;
  mascotasPerdidas: number;
  mascotasEnCasa: number;
  notificacionesEmail: boolean;
  notificacionesInApp: boolean;
};

export async function obtenerDatosPerfil(): Promise<DatosPerfilUsuario | null> {
  const { auth } = await import("@/auth");
  const sesion = await auth();

  if (!sesion?.user?.id) return null;

  const [usuario] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      telefono: users.telefono,
      ciudad: users.ciudad,
      rol: users.rol,
      image: users.image,
      passwordHash: users.passwordHash,
      emailVerified: users.emailVerified,
      notificacionesEmail: users.notificacionesEmail,
      notificacionesInApp: users.notificacionesInApp,
    })
    .from(users)
    .where(eq(users.id, sesion.user.id))
    .limit(1);

  if (!usuario) return null;

  const [cuentaGoogle] = await db
    .select({ provider: accounts.provider })
    .from(accounts)
    .where(
      and(eq(accounts.userId, sesion.user.id), eq(accounts.provider, "google"))
    )
    .limit(1);

  const { listarMisMascotas } = await import("@/actions/mascotas");
  const mascotas = await listarMisMascotas();
  const mascotasPerdidas = mascotas.filter((m) => m.estado === "PERDIDA").length;
  const mascotasEnCasa = mascotas.filter((m) => m.estado === "EN_CASA").length;

  return {
    id: usuario.id,
    nombre: usuario.name,
    email: usuario.email,
    telefono: usuario.telefono,
    ciudad: usuario.ciudad,
    rol: usuario.rol,
    imagen: usuario.image,
    emailVerificado: !!usuario.emailVerified,
    tieneContrasena: !!usuario.passwordHash,
    cuentaGoogle: !!cuentaGoogle,
    totalMascotas: mascotas.length,
    mascotasPerdidas,
    mascotasEnCasa,
    notificacionesEmail: usuario.notificacionesEmail,
    notificacionesInApp: usuario.notificacionesInApp,
  };
}

export async function obtenerEstadoBienvenida(): Promise<
  | { ok: false }
  | {
      ok: true;
      completada: boolean;
      nombre: string | null;
      telefono: string | null;
      ciudad: string | null;
    }
> {
  const { auth } = await import("@/auth");
  const sesion = await auth();

  if (!sesion?.user?.id) return { ok: false };

  const [usuario] = await db
    .select({
      bienvenidaCompletada: users.bienvenidaCompletada,
      name: users.name,
      telefono: users.telefono,
      ciudad: users.ciudad,
    })
    .from(users)
    .where(eq(users.id, sesion.user.id))
    .limit(1);

  if (!usuario) return { ok: false };

  return {
    ok: true,
    completada: usuario.bienvenidaCompletada,
    nombre: usuario.name,
    telefono: usuario.telefono,
    ciudad: usuario.ciudad,
  };
}

export async function completarBienvenida(datos: {
  nombre: string;
  telefono?: string;
  ciudad?: string;
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
    .set({
      name: nombre,
      telefono: datos.telefono?.trim() || null,
      ciudad: datos.ciudad?.trim() || null,
      bienvenidaCompletada: true,
    })
    .where(eq(users.id, sesion.user.id));

  return { ok: true, mensaje: "¡Perfil actualizado! Bienvenido a PawPatrol." };
}

export async function obtenerImagenPerfilSesion(): Promise<string | null> {
  const { auth } = await import("@/auth");
  const sesion = await auth();

  if (!sesion?.user?.id) return null;

  const [usuario] = await db
    .select({ image: users.image })
    .from(users)
    .where(eq(users.id, sesion.user.id))
    .limit(1);

  return usuario?.image ?? null;
}
