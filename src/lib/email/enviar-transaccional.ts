import {
  obtenerTransporte,
  remitentePorDefecto,
} from "@/lib/email/transporte";

type Opciones = {
  email: string;
  subject: string;
  html: string;
  logEtiqueta: string;
  logExtra?: () => void;
  errorSinSmtp?: string;
  /** Sin log en consola si falta SMTP (avisos opcionales) */
  silencioso?: boolean;
};

export async function enviarCorreoTransaccional({
  email,
  subject,
  html,
  logEtiqueta,
  logExtra,
  errorSinSmtp,
  silencioso = false,
}: Opciones): Promise<{ enviado: boolean; error?: string }> {
  const transporte = obtenerTransporte();

  if (!transporte) {
    if (!silencioso) {
      console.info(`\n[PawPatroll] ${logEtiqueta} (SMTP no configurado)`);
      logExtra?.();
    }
    if (errorSinSmtp === undefined) {
      return { enviado: false };
    }
    return {
      enviado: false,
      error: errorSinSmtp,
    };
  }

  try {
    await transporte.sendMail({
      from: remitentePorDefecto(),
      to: email,
      subject,
      html,
    });
    return { enviado: true };
  } catch (err) {
    const mensaje =
      err instanceof Error ? err.message : "No se pudo enviar el correo.";
    const log = silencioso ? console.warn : console.error;
    log(`[PawPatroll] SMTP ${logEtiqueta}:`, mensaje);
    return { enviado: false, error: mensaje };
  }
}
