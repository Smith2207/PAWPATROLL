import nodemailer from "nodemailer";

function contrasenaSmtp() {
  const pass = process.env.SMTP_PASS?.trim();
  if (!pass) return undefined;
  // Gmail muestra la contraseña de aplicación con espacios; quitarlos.
  return pass.replace(/\s+/g, "");
}

export function correoSoporteConfigurado() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      contrasenaSmtp()
  );
}

export function obtenerTransporte() {
  if (!correoSoporteConfigurado()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: contrasenaSmtp(),
    },
  });
}

export function remitentePorDefecto() {
  return (
    process.env.EMAIL_FROM ??
    "PawPatrol <paw.patrol.soporte@gmail.com>"
  );
}
