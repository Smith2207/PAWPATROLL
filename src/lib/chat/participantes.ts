/** Participantes y títulos en conversaciones de chat (sin BD — usable en cliente). */

export const NOMBRE_USUARIO_ANONIMO = "Usuario";

export type ParticipanteConversacion = {
  userId: string | null;
  nombre: string;
  imagen: string | null;
};

export type ConversacionAvistamiento = {
  otro: ParticipanteConversacion;
  mascotaLinea: string;
};

export function normalizarNombreParticipante(
  nombre: string | null | undefined
): string {
  const limpio = nombre?.trim();
  return limpio || NOMBRE_USUARIO_ANONIMO;
}

export function crearParticipante(
  userId: string | null | undefined,
  nombre: string | null | undefined,
  imagen?: string | null
): ParticipanteConversacion {
  return {
    userId: userId ?? null,
    nombre: normalizarNombreParticipante(nombre),
    imagen: imagen ?? null,
  };
}

export function resolverOtroParticipante(
  miUserId: string,
  dueno: ParticipanteConversacion,
  reportante: ParticipanteConversacion
): ParticipanteConversacion {
  if (dueno.userId && dueno.userId === miUserId) {
    return reportante;
  }
  if (reportante.userId && reportante.userId === miUserId) {
    return dueno;
  }
  if (reportante.userId && !dueno.userId) return dueno;
  if (dueno.userId && !reportante.userId) return reportante;
  return reportante;
}

export function lineaMascotaConversacion(
  nombreMascota: string | null | undefined,
  _tipoMascota?: string | null
): string {
  return nombreMascota?.trim() || "Mascota";
}

export type DatosParticipantesAvistamiento = {
  duenoUserId: string;
  duenoNombre: string | null | undefined;
  duenoImagen?: string | null;
  reportanteUserId: string | null;
  reportanteNombre: string | null | undefined;
  reportanteImagen?: string | null;
  nombreMascota?: string | null;
  tipoMascota?: string | null;
};

export function resolverConversacionAvistamiento(
  miUserId: string,
  datos: DatosParticipantesAvistamiento
): ConversacionAvistamiento {
  const dueno = crearParticipante(
    datos.duenoUserId,
    datos.duenoNombre,
    datos.duenoImagen
  );
  const reportante = crearParticipante(
    datos.reportanteUserId,
    datos.reportanteNombre,
    datos.reportanteImagen
  );
  const otro = resolverOtroParticipante(miUserId, dueno, reportante);
  const mascotaLinea = lineaMascotaConversacion(
    datos.nombreMascota,
    datos.tipoMascota
  );

  return { otro, mascotaLinea };
}

export function tituloNotificacionMensaje(
  nombreRemitente: string | null | undefined,
  nombreMascota?: string | null,
  tipoMascota?: string | null
): string {
  const remitente = normalizarNombreParticipante(nombreRemitente);
  if (nombreMascota?.trim()) {
    return `${lineaMascotaConversacion(nombreMascota, tipoMascota)} · ${remitente}`;
  }
  return remitente;
}
