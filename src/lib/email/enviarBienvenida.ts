/**
 * Correo transaccional (SMTP): enviar bienvenida.
 */
import { ETIQUETAS_ROL } from "@/lib/auth/roles";
import type { RolUsuario } from "@/lib/db/schema";
import { plantillaBienvenida } from "@/lib/email/plantillas";
import {
  obtenerTransporte,
  remitentePorDefecto,
} from "@/lib/email/transporte";

export async function enviarCorreoBienvenida(
  email: string,
  nombre: string,
  rol: RolUsuario
): Promise<{ enviado: boolean; error?: string }> {
  const transporte = obtenerTransporte();

  if (!transporte) {
    console.info("\n[PawPatrol] Bienvenida (SMTP no configurado):", email, "\n");
    return { enviado: false };
  }

  try {
    await transporte.sendMail({
      from: remitentePorDefecto(),
      to: email,
      subject: "¡Bienvenido a PawPatroll!",
      html: plantillaBienvenida(nombre, ETIQUETAS_ROL[rol]),
    });
    return { enviado: true };
  } catch (err) {
    const mensaje =
      err instanceof Error ? err.message : "No se pudo enviar el correo.";
    console.error("[PawPatrol] SMTP bienvenida:", mensaje);
    return { enviado: false, error: mensaje };
  }
}
