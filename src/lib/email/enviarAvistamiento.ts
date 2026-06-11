/**
 * Correo transaccional (SMTP): enviar avistamiento.
 */
import {
  plantillaAvistamientoNuevo,
  plantillaMensajeChatAvistamiento,
} from "@/lib/email/plantillas";
import { enviarCorreoTransaccional } from "@/lib/email/enviar-transaccional";
import { urlBaseApp } from "@/lib/url-app";

export async function enviarCorreoAvistamientoNuevo(opciones: {
  emailDueno: string;
  nombreDueno: string | null;
  nombreMascota: string;
  mascotaId: string;
  numeroReporte: number;
  direccion: string | null;
}) {
  const enlace = `${urlBaseApp()}/mis-mascotas/${opciones.mascotaId}/caso`;

  await enviarCorreoTransaccional({
    email: opciones.emailDueno,
    subject: `Nuevo avistamiento de ${opciones.nombreMascota} — PawPatrol`,
    html: plantillaAvistamientoNuevo({
      nombreDueno: opciones.nombreDueno,
      nombreMascota: opciones.nombreMascota,
      numeroReporte: opciones.numeroReporte,
      direccion: opciones.direccion,
      enlace,
    }),
    logEtiqueta: "aviso de avistamiento",
    silencioso: true,
  });
}

export async function enviarCorreoMensajeChat(opciones: {
  emailDestino: string;
  nombreDestino: string | null;
  nombreMascota: string;
  slugMascota: string;
  autorMensaje: string;
  extracto: string;
  enlacePrivado?: string;
}) {
  const enlace =
    opciones.enlacePrivado ??
    `${urlBaseApp()}/mascota/${opciones.slugMascota}#avistamientos`;

  await enviarCorreoTransaccional({
    email: opciones.emailDestino,
    subject: `Nuevo mensaje sobre ${opciones.nombreMascota} — PawPatrol`,
    html: plantillaMensajeChatAvistamiento({
      nombreDestino: opciones.nombreDestino,
      nombreMascota: opciones.nombreMascota,
      autorMensaje: opciones.autorMensaje,
      extracto: opciones.extracto,
      enlace,
    }),
    logEtiqueta: "aviso de mensaje",
    silencioso: true,
  });
}
