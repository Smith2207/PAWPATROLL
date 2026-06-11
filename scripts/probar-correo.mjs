/**
 * Script de mantenimiento: probar-correo.
 */
import { config } from "dotenv";
import nodemailer from "nodemailer";

config({ path: ".env.local" });

const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT, EMAIL_FROM } = process.env;

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.error("ERR: Faltan SMTP_HOST, SMTP_USER o SMTP_PASS en .env.local");
  process.exit(1);
}

const transporte = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT ?? 587),
  secure: false,
  auth: { user: SMTP_USER, pass: SMTP_PASS.replace(/\s/g, "") },
});

try {
  await transporte.verify();
  console.log("OK: Gmail SMTP conectado correctamente");
  console.log("   Cuenta:", SMTP_USER);
  console.log("   Desde:", EMAIL_FROM ?? SMTP_USER);
} catch (e) {
  console.error("ERR:", e.message);
  process.exit(1);
}
