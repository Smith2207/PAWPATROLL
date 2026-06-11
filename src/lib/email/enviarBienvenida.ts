/**
 * Correo transaccional (SMTP): enviar bienvenida.
 */
import { ETIQUETAS_ROL } from "@/lib/auth/roles";
import type { RolUsuario } from "@/lib/db/schema";
import { plantillaBienvenida } from "@/lib/email/plantillas";
import { enviarCorreoTransaccional } from "@/lib/email/enviar-transaccional";

export async function enviarCorreoBienvenida(
  email: string,
  nombre: string,
  rol: RolUsuario
): Promise<{ enviado: boolean; error?: string }> {
  return enviarCorreoTransaccional({
    email,
    subject: "¡Bienvenido a PawPatroll!",
    html: plantillaBienvenida(nombre, ETIQUETAS_ROL[rol]),
    logEtiqueta: "Bienvenida",
    logExtra: () => console.info("   Para:", email, "\n"),
  });
}
