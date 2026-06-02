import { obtenerTransporte, remitentePorDefecto, correoSoporteConfigurado } from "@/lib/email/transporte";
import {
  plantillaAvistamientoNuevo,
  plantillaMensajeChatAvistamiento,
} from "@/lib/email/plantillas";
import { urlBaseApp } from "@/lib/url-app";

export async function enviarCorreoAvistamientoNuevo(opciones: {
  emailDueno: string;
  nombreDueno: string | null;
  nombreMascota: string;
  mascotaId: string;
  numeroReporte: number;
  direccion: string | null;
}) {
  if (!correoSoporteConfigurado()) return;

  const transporte = obtenerTransporte();
  if (!transporte) return;

  const enlace = `${urlBaseApp()}/mis-mascotas/${opciones.mascotaId}/caso`;

  try {
    await transporte.sendMail({
      from: remitentePorDefecto(),
      to: opciones.emailDueno,
      subject: `Nuevo avistamiento de ${opciones.nombreMascota} — PawPatrol`,
      html: plantillaAvistamientoNuevo({
        nombreDueno: opciones.nombreDueno,
        nombreMascota: opciones.nombreMascota,
        numeroReporte: opciones.numeroReporte,
        direccion: opciones.direccion,
        enlace,
      }),
    });
  } catch (error) {
    console.warn("[email] No se pudo enviar aviso de avistamiento:", error);
  }
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
  if (!correoSoporteConfigurado()) return;

  const transporte = obtenerTransporte();
  if (!transporte) return;

  const enlace =
    opciones.enlacePrivado ??
    `${urlBaseApp()}/mascota/${opciones.slugMascota}#avistamientos`;

  try {
    await transporte.sendMail({
      from: remitentePorDefecto(),
      to: opciones.emailDestino,
      subject: `Nuevo mensaje sobre ${opciones.nombreMascota} — PawPatrol`,
      html: plantillaMensajeChatAvistamiento({
        nombreDestino: opciones.nombreDestino,
        nombreMascota: opciones.nombreMascota,
        autorMensaje: opciones.autorMensaje,
        extracto: opciones.extracto,
        enlace,
      }),
    });
  } catch (error) {
    console.warn("[email] No se pudo enviar aviso de mensaje:", error);
  }
}
