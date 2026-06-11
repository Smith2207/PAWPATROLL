/**
 * Correo transaccional (SMTP): enviar recuperacion.
 */
import { plantillaRecuperarContrasena } from "@/lib/email/plantillas";
import { enviarCorreoTransaccional } from "@/lib/email/enviar-transaccional";

export async function enviarCorreoRecuperacion(
  email: string,
  enlace: string,
  nombre?: string
): Promise<{ enviado: boolean; error?: string }> {
  return enviarCorreoTransaccional({
    email,
    subject: "Restablecer contraseña — PawPatrol",
    html: plantillaRecuperarContrasena(nombre ?? "", enlace),
    logEtiqueta: "Recuperar contraseña",
    logExtra: () => {
      console.info("   Para:", email);
      console.info("   Enlace:", enlace, "\n");
    },
    errorSinSmtp:
      "SMTP no configurado. Añade SMTP_HOST, SMTP_USER y SMTP_PASS en .env.local.",
  });
}
