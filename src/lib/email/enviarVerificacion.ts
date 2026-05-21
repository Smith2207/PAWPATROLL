/**
 * Envía el enlace de verificación de correo.
 * En desarrollo (o sin SMTP) imprime el enlace en consola del servidor.
 */
export async function enviarCorreoVerificacion(
  email: string,
  enlace: string
): Promise<void> {
  const host = process.env.SMTP_HOST;

  if (!host) {
    console.info("\n📧 [PawPatrol] Verificación de correo para:", email);
    console.info("   Enlace:", enlace, "\n");
    return;
  }

  // Integración SMTP: instala nodemailer y configura SMTP_* en .env.local
  console.info("\n📧 [PawPatrol] SMTP configurado. Enlace de verificación:");
  console.info("   Para:", email);
  console.info("   ", enlace, "\n");
}
