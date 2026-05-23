import { plantillaRecuperarContrasena } from "@/lib/email/plantillas";
import {
  correoSoporteConfigurado,
  obtenerTransporte,
  remitentePorDefecto,
} from "@/lib/email/transporte";

export async function enviarCorreoRecuperacion(
  email: string,
  enlace: string,
  nombre?: string
): Promise<{ enviado: boolean; error?: string }> {
  const transporte = obtenerTransporte();

  if (!transporte) {
    console.info("\n🔑 [PawPatrol] Recuperar contraseña (SMTP no configurado)");
    console.info("   Para:", email);
    console.info("   Enlace:", enlace, "\n");
    return {
      enviado: false,
      error:
        "SMTP no configurado. Añade SMTP_HOST, SMTP_USER y SMTP_PASS en .env.local.",
    };
  }

  try {
    await transporte.sendMail({
      from: remitentePorDefecto(),
      to: email,
      subject: "Restablecer contraseña — PawPatrol",
      html: plantillaRecuperarContrasena(nombre ?? "", enlace),
    });
    return { enviado: true };
  } catch (err) {
    const mensaje =
      err instanceof Error ? err.message : "No se pudo enviar el correo.";
    console.error("[PawPatrol] SMTP recuperación:", mensaje);
    return { enviado: false, error: mensaje };
  }
}

export function smtpListoRecuperacion() {
  return correoSoporteConfigurado();
}
