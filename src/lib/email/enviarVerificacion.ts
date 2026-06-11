/**
 * Correo transaccional (SMTP): enviar verificacion.
 */
import { plantillaVerificacion } from "@/lib/email/plantillas";
import { enviarCorreoTransaccional } from "@/lib/email/enviar-transaccional";

export async function enviarCorreoVerificacion(
  email: string,
  enlace: string,
  nombre?: string
): Promise<{ enviado: boolean; error?: string }> {
  return enviarCorreoTransaccional({
    email,
    subject: "Verifica tu correo — PawPatrol",
    html: plantillaVerificacion(nombre ?? "", enlace),
    logEtiqueta: "Verificación",
    logExtra: () => {
      console.info("   Para:", email);
      console.info("   Enlace:", enlace, "\n");
    },
    errorSinSmtp:
      "SMTP no configurado. Añade SMTP_HOST, SMTP_USER y SMTP_PASS en .env.local.",
  });
}
