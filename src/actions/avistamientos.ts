"use server";

import { and, asc, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  avistamientos,
  mascotas,
  mensajesAvistamiento,
  users,
  type EstadoAvistamiento,
} from "@/lib/db/schema";
import type { ResultadoAuth } from "@/actions/autenticacion";
import { pareceCoordenadas } from "@/lib/geo/etiqueta-ubicacion";
import { coordenadasValidas, type Coordenadas } from "@/lib/geo/tipos";
import { esTipoMascotaPermitido, TIPOS_MASCOTA } from "@/lib/mascotas/tipos";
import { emitirTiempoReal } from "@/lib/tiempo-real/hub";
import { enviarCorreoAvistamientoNuevo, enviarCorreoMensajeChat } from "@/lib/email/enviarAvistamiento";
import {
  crearNotificacionPrivada,
  registrarCoincidenciaIaDueno,
  registrarEventoCaso,
  usuarioAceptaNotificacionesEmail,
} from "@/lib/casos/servicio-caso";
import { tituloNotificacionMensaje } from "@/lib/chat/conversacion";

export type DatosAvistamiento = {
  mascotaId?: string;
  lat: number;
  lng: number;
  direccion?: string;
  tipoMascota?: string;
  tamano?: string;
  color?: string;
  raza?: string;
  fechaHora?: string;
  referencias?: string;
  direccionMovimiento?: string;
  descripcion?: string;
  fotoUrl?: string;
  nombreReportante?: string;
  telefonoReportante?: string;
  enTiempoReal?: boolean;
  /** Similitud IA 0–1 al vincular foto con mascota */
  similitudIa?: number;
};

export type AvistamientoConMensajes = Awaited<
  ReturnType<typeof listarAvistamientosPorMascota>
>[number];

async function sesionUsuario() {
  const { auth } = await import("@/auth");
  const sesion = await auth();
  return sesion?.user?.id ?? null;
}

async function esDuenoMascota(mascotaId: string, userId: string | null) {
  if (!userId) return false;
  const [m] = await db
    .select({ userId: mascotas.userId })
    .from(mascotas)
    .where(eq(mascotas.id, mascotaId))
    .limit(1);
  return m?.userId === userId;
}

async function siguienteNumeroReporte(mascotaId: string | null): Promise<number> {
  const [fila] = await db
    .select({
      max: sql<number>`coalesce(max(${avistamientos.numeroReporte}), 0)::int`,
    })
    .from(avistamientos)
    .where(
      mascotaId
        ? eq(avistamientos.mascotaId, mascotaId)
        : isNull(avistamientos.mascotaId)
    );

  return (fila?.max ?? 0) + 1;
}

async function notificarDuenoAvistamiento(
  mascotaId: string,
  numeroReporte: number,
  direccion: string | null
) {
  const [fila] = await db
    .select({
      email: users.email,
      nombreDueno: users.name,
      nombreMascota: mascotas.nombre,
    })
    .from(mascotas)
    .innerJoin(users, eq(mascotas.userId, users.id))
    .where(eq(mascotas.id, mascotaId))
    .limit(1);

  if (!fila?.email) return;

  void enviarCorreoAvistamientoNuevo({
    emailDueno: fila.email,
    nombreDueno: fila.nombreDueno,
    nombreMascota: fila.nombreMascota,
    mascotaId,
    numeroReporte,
    direccion,
  });
}

export async function crearAvistamiento(
  datos: DatosAvistamiento
): Promise<
  ResultadoAuth & { id?: string; numeroReporte?: number }
> {
  const coords: Coordenadas = { lat: datos.lat, lng: datos.lng };
  if (!coordenadasValidas(coords)) {
    return { ok: false, error: "Ubicación GPS no válida." };
  }

  if (datos.mascotaId) {
    const [mascota] = await db
      .select({ id: mascotas.id, estado: mascotas.estado, tipo: mascotas.tipo })
      .from(mascotas)
      .where(eq(mascotas.id, datos.mascotaId))
      .limit(1);

    if (!mascota) {
      return { ok: false, error: "Mascota no encontrada." };
    }
    if (!esTipoMascotaPermitido(mascota.tipo)) {
      return { ok: false, error: "Mascota no válida." };
    }
  }

  const tipo = datos.tipoMascota?.trim();
  if (tipo && !TIPOS_MASCOTA.includes(tipo as (typeof TIPOS_MASCOTA)[number])) {
    return { ok: false, error: "Indica si es perro o gato." };
  }

  const userId = await sesionUsuario();
  if (!userId) {
    return {
      ok: false,
      error:
        "Debes iniciar sesión o crear una cuenta para publicar el avistamiento.",
    };
  }

  const [usuario] = await db
    .select({
      name: users.name,
      telefono: users.telefono,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const numeroReporte = await siguienteNumeroReporte(datos.mascotaId ?? null);

  const direccionLimpia =
    datos.direccion?.trim() && !pareceCoordenadas(datos.direccion)
      ? datos.direccion.trim()
      : null;

  const fechaReporte = datos.fechaHora?.trim()
    ? new Date(datos.fechaHora)
    : null;

  const [insertado] = await db
    .insert(avistamientos)
    .values({
      mascotaId: datos.mascotaId ?? null,
      userId,
      numeroReporte,
      ...(fechaReporte && !Number.isNaN(fechaReporte.getTime())
        ? { createdAt: fechaReporte }
        : {}),
      lat: String(coords.lat),
      lng: String(coords.lng),
      direccion: direccionLimpia,
      tipoMascota: tipo || null,
      tamano: datos.tamano?.trim() || null,
      color: datos.color?.trim() || null,
      raza: datos.raza?.trim() || null,
      referencias: datos.referencias?.trim() || null,
      direccionMovimiento: datos.direccionMovimiento?.trim() || null,
      descripcion: datos.descripcion?.trim() || null,
      fotoUrl: datos.fotoUrl?.startsWith("data:image/") ? datos.fotoUrl : null,
      nombreReportante:
        datos.nombreReportante?.trim() || usuario?.name?.trim() || null,
      telefonoReportante:
        datos.telefonoReportante?.trim() || usuario?.telefono?.trim() || null,
      enTiempoReal: Boolean(datos.enTiempoReal),
      estado: "PENDIENTE",
    })
    .returning({
      id: avistamientos.id,
      numeroReporte: avistamientos.numeroReporte,
      mascotaId: avistamientos.mascotaId,
    });

  if (datos.mascotaId) {
    const [dueno] = await db
      .select({ userId: mascotas.userId, slug: mascotas.slug, nombre: mascotas.nombre })
      .from(mascotas)
      .where(eq(mascotas.id, datos.mascotaId))
      .limit(1);

    void notificarDuenoAvistamiento(
      datos.mascotaId,
      insertado.numeroReporte,
      direccionLimpia
    );

    if (dueno) {
      await registrarEventoCaso({
        mascotaId: datos.mascotaId,
        avistamientoId: insertado.id,
        tipo: "AVISTAMIENTO_NUEVO",
        titulo: `Nuevo avistamiento #${insertado.numeroReporte}`,
        detalle: direccionLimpia ?? undefined,
        actorUserId: userId,
      });

      if (datos.fotoUrl?.startsWith("data:image/")) {
        await registrarEventoCaso({
          mascotaId: datos.mascotaId,
          avistamientoId: insertado.id,
          tipo: "FOTO_AGREGADA",
          titulo: `Foto en avistamiento #${insertado.numeroReporte}`,
          actorUserId: userId,
        });
      }

      await crearNotificacionPrivada({
        userId: dueno.userId,
        tipo: "AVISTAMIENTO_NUEVO",
        prioridad: "ALTA",
        titulo: `Nuevo avistamiento de ${dueno.nombre}`,
        cuerpo: direccionLimpia ?? "Alguien reportó haber visto a tu mascota.",
        enlace: `/mis-mascotas/${datos.mascotaId}/caso`,
        mascotaId: datos.mascotaId,
        avistamientoId: insertado.id,
      });

      if (userId) {
        await crearNotificacionPrivada({
          userId,
          tipo: "AVISTAMIENTO_NUEVO",
          prioridad: "NORMAL",
          titulo: `Tu avistamiento #${insertado.numeroReporte} fue registrado`,
          cuerpo: "Puedes enviar mensajes en privado con el dueño desde tu panel.",
          enlace: `/avistamiento/${insertado.id}`,
          mascotaId: datos.mascotaId,
          avistamientoId: insertado.id,
          grupoClave: `avist-creado:${insertado.id}`,
        });
      }

      if (
        datos.similitudIa != null &&
        datos.similitudIa >= 0.65 &&
        datos.fotoUrl?.startsWith("data:image/")
      ) {
        await registrarCoincidenciaIaDueno({
          mascotaId: datos.mascotaId,
          avistamientoId: insertado.id,
          similitud: datos.similitudIa,
          detalle: `Coincidencia en avistamiento #${insertado.numeroReporte}`,
        });
      }
    }
  }

  emitirTiempoReal({
    tipo: "avistamiento:nuevo",
    mascotaId: insertado.mascotaId,
    avistamientoId: insertado.id,
  });
  emitirTiempoReal({ tipo: "mapa:actualizado" });

  revalidatePath("/");
  revalidatePath("/mapa");
  if (datos.mascotaId) {
    const [m] = await db
      .select({ slug: mascotas.slug })
      .from(mascotas)
      .where(eq(mascotas.id, datos.mascotaId))
      .limit(1);
    if (m?.slug) revalidatePath(`/mascota/${m.slug}`);
  }

  const mensajeMascota = datos.mascotaId
    ? `Avistamiento #${insertado.numeroReporte} registrado para esta mascota.`
    : `Avistamiento #${insertado.numeroReporte} registrado en el mapa.`;

  return {
    ok: true,
    mensaje: mensajeMascota,
    id: insertado.id,
    numeroReporte: insertado.numeroReporte,
  };
}

export async function listarAvistamientosPorMascota(
  mascotaId: string,
  opciones?: { incluirDescartados?: boolean; dueno?: boolean }
) {
  const condiciones = [eq(avistamientos.mascotaId, mascotaId)];
  if (!opciones?.incluirDescartados && !opciones?.dueno) {
    condiciones.push(ne(avistamientos.estado, "DESCARTADO"));
  }

  const lista = await db
    .select()
    .from(avistamientos)
    .where(and(...condiciones))
    .orderBy(desc(avistamientos.numeroReporte));

  if (lista.length === 0) return [];

  const incluirMensajes = Boolean(opciones?.dueno);
  if (!incluirMensajes) {
    return lista.map((av) => ({ ...av, mensajes: [] }));
  }

  const ids = lista.map((a) => a.id);
  const mensajes = await db
    .select()
    .from(mensajesAvistamiento)
    .where(inArray(mensajesAvistamiento.avistamientoId, ids))
    .orderBy(asc(mensajesAvistamiento.createdAt));

  const porAvistamiento = new Map<string, typeof mensajes>();
  for (const m of mensajes) {
    const arr = porAvistamiento.get(m.avistamientoId) ?? [];
    arr.push(m);
    porAvistamiento.set(m.avistamientoId, arr);
  }

  return lista.map((av) => ({
    ...av,
    mensajes: porAvistamiento.get(av.id) ?? [],
  }));
}

export async function gestionarEstadoAvistamiento(
  avistamientoId: string,
  estado: Extract<EstadoAvistamiento, "VERIFICADO" | "DESCARTADO">,
  motivoDescarte?: string
): Promise<ResultadoAuth> {
  const userId = await sesionUsuario();
  if (!userId) return { ok: false, error: "Debes iniciar sesión." };

  const [av] = await db
    .select()
    .from(avistamientos)
    .where(eq(avistamientos.id, avistamientoId))
    .limit(1);

  if (!av?.mascotaId) {
    return { ok: false, error: "Avistamiento no encontrado." };
  }

  const dueno = await esDuenoMascota(av.mascotaId, userId);
  if (!dueno) {
    return { ok: false, error: "Solo el dueño puede gestionar avistamientos." };
  }

  await db
    .update(avistamientos)
    .set({
      estado,
      verificadoPor: userId,
      verificadoAt: new Date(),
      motivoDescarte:
        estado === "DESCARTADO" ? motivoDescarte?.trim() || null : null,
    })
    .where(eq(avistamientos.id, avistamientoId));

  const tipoEvento =
    estado === "VERIFICADO" ? "AVISTAMIENTO_VERIFICADO" : "AVISTAMIENTO_DESCARTADO";
  await registrarEventoCaso({
    mascotaId: av.mascotaId,
    avistamientoId,
    tipo: tipoEvento,
    titulo:
      estado === "VERIFICADO"
        ? `Avistamiento #${av.numeroReporte} verificado`
        : `Avistamiento #${av.numeroReporte} descartado`,
    actorUserId: userId,
  });

  if (av.userId) {
    await crearNotificacionPrivada({
      userId: av.userId,
      tipo:
        estado === "VERIFICADO"
          ? "AVISTAMIENTO_VERIFICADO"
          : "AVISTAMIENTO_DESCARTADO",
      titulo:
        estado === "VERIFICADO"
          ? "Tu avistamiento fue verificado"
          : "Tu avistamiento fue descartado",
      cuerpo:
        estado === "DESCARTADO" && motivoDescarte
          ? motivoDescarte
          : undefined,
      enlace: `/avistamiento/${avistamientoId}`,
      mascotaId: av.mascotaId,
      avistamientoId,
    });
  }

  emitirTiempoReal({
    tipo: "avistamiento:actualizado",
    mascotaId: av.mascotaId,
    avistamientoId,
  });
  emitirTiempoReal({ tipo: "mapa:actualizado" });

  const [m] = await db
    .select({ slug: mascotas.slug })
    .from(mascotas)
    .where(eq(mascotas.id, av.mascotaId))
    .limit(1);
  if (m?.slug) revalidatePath(`/mascota/${m.slug}`);
  revalidatePath("/");

  return {
    ok: true,
    mensaje:
      estado === "VERIFICADO"
        ? "Avistamiento verificado."
        : "Avistamiento descartado.",
  };
}

export async function enviarMensajeAvistamiento(
  avistamientoId: string,
  contenido: string,
  adjuntoUrl?: string | null
): Promise<ResultadoAuth & { id?: string }> {
  const texto = contenido.trim();
  const adjunto = adjuntoUrl?.trim() || null;

  if (texto.length < 1 && !adjunto) {
    return { ok: false, error: "Escribe un mensaje o adjunta una imagen." };
  }
  if (texto.length > 2000) {
    return { ok: false, error: "Mensaje demasiado largo." };
  }
  if (adjunto && !adjunto.startsWith("data:image/")) {
    return { ok: false, error: "Solo se permiten imágenes como adjunto." };
  }
  if (adjunto && adjunto.length > 900_000) {
    return { ok: false, error: "La imagen es demasiado pesada." };
  }

  const userId = await sesionUsuario();
  if (!userId) {
    return { ok: false, error: "Debes iniciar sesión para enviar mensajes." };
  }

  const [av] = await db
    .select({
      av: avistamientos,
      mascotaUserId: mascotas.userId,
      nombreMascota: mascotas.nombre,
      tipoMascota: mascotas.tipo,
      slug: mascotas.slug,
      emailDueno: users.email,
      nombreDueno: users.name,
    })
    .from(avistamientos)
    .leftJoin(mascotas, eq(avistamientos.mascotaId, mascotas.id))
    .leftJoin(users, eq(mascotas.userId, users.id))
    .where(eq(avistamientos.id, avistamientoId))
    .limit(1);

  if (!av?.av.mascotaId) {
    return { ok: false, error: "Avistamiento no encontrado." };
  }

  const esDueno = userId === av.mascotaUserId;
  const esReportante = userId != null && av.av.userId === userId;

  if (!esDueno && !esReportante) {
    return {
      ok: false,
      error: "Solo el dueño y quien reportó pueden usar estos mensajes privados.",
    };
  }

  const [usuarioActual] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const nombreAutor =
    usuarioActual?.name?.trim() ||
    (esDueno ? av.nombreDueno : av.av.nombreReportante) ||
    "Participante";

  const cuerpoMensaje = texto || (adjunto ? "📷 Foto" : " ");

  const [insertado] = await db
    .insert(mensajesAvistamiento)
    .values({
      avistamientoId,
      userId,
      autorNombre: nombreAutor,
      contenido: cuerpoMensaje,
      adjuntoUrl: adjunto,
    })
    .returning({ id: mensajesAvistamiento.id });

  emitirTiempoReal({
    tipo: "mensaje:nuevo",
    avistamientoId,
    mascotaId: av.av.mascotaId,
  });

  const extractoNotif = adjunto && !texto ? "📷 Te enviaron una foto" : texto.slice(0, 160);

  if (av.av.mascotaId) {
    await registrarEventoCaso({
      mascotaId: av.av.mascotaId,
      avistamientoId,
      tipo: "MENSAJE_ENVIADO",
      titulo: `Nuevo mensaje en avistamiento #${av.av.numeroReporte}`,
      detalle: (texto || "Foto adjunta").slice(0, 120),
      actorUserId: userId ?? undefined,
    });
  }

  const enlaceChat = `/avistamiento/${avistamientoId}`;
  const enlaceCaso = av.av.mascotaId
    ? `/mis-mascotas/${av.av.mascotaId}/caso`
    : enlaceChat;

  if (esDueno && av.av.userId) {
    await crearNotificacionPrivada({
      userId: av.av.userId,
      tipo: "MENSAJE_NUEVO",
      prioridad: "NORMAL",
      titulo: tituloNotificacionMensaje(
        nombreAutor,
        av.nombreMascota,
        av.tipoMascota
      ),
      cuerpo: extractoNotif,
      enlace: enlaceChat,
      mascotaId: av.av.mascotaId ?? undefined,
      avistamientoId,
      grupoClave: `msg:${avistamientoId}:reportante`,
    });

    if (av.av.userId) {
      const [reportante] = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, av.av.userId))
        .limit(1);

      if (
        reportante?.email &&
        (await usuarioAceptaNotificacionesEmail(av.av.userId))
      ) {
        void enviarCorreoMensajeChat({
          emailDestino: reportante.email,
          nombreDestino: reportante.name,
          nombreMascota: av.nombreMascota ?? "Mascota",
          slugMascota: av.slug ?? "",
          autorMensaje: nombreAutor ?? "Dueño",
          extracto: (adjunto && !texto ? "📷 Foto" : texto).slice(0, 200),
          enlacePrivado: enlaceChat,
        });
      }
    }
  } else if (av.mascotaUserId) {
    await crearNotificacionPrivada({
      userId: av.mascotaUserId,
      tipo: "MENSAJE_NUEVO",
      prioridad: "NORMAL",
      titulo: tituloNotificacionMensaje(
        nombreAutor,
        av.nombreMascota,
        av.tipoMascota
      ),
      cuerpo: extractoNotif,
      enlace: enlaceCaso,
      mascotaId: av.av.mascotaId ?? undefined,
      avistamientoId,
      grupoClave: `msg:${avistamientoId}:dueno`,
    });

    if (
      av.emailDueno &&
      (await usuarioAceptaNotificacionesEmail(av.mascotaUserId))
    ) {
      void enviarCorreoMensajeChat({
        emailDestino: av.emailDueno,
        nombreDestino: av.nombreDueno,
        nombreMascota: av.nombreMascota ?? "Mascota",
        slugMascota: av.slug ?? "",
        autorMensaje: nombreAutor ?? "Alguien",
        extracto: (adjunto && !texto ? "📷 Foto" : texto).slice(0, 200),
        enlacePrivado: enlaceCaso,
      });
    }
  }

  if (av.slug) revalidatePath(`/mascota/${av.slug}`);

  return { ok: true, mensaje: "Mensaje enviado.", id: insertado.id };
}

export async function listarMascotasPerdidasParaSelector() {
  return db
    .select({
      id: mascotas.id,
      nombre: mascotas.nombre,
      slug: mascotas.slug,
      tipo: mascotas.tipo,
    })
    .from(mascotas)
    .where(
      and(eq(mascotas.estado, "PERDIDA"), inArray(mascotas.tipo, [...TIPOS_MASCOTA]))
    )
    .orderBy(desc(mascotas.updatedAt))
    .limit(50);
}

export async function puedeGestionarAvistamientos(mascotaId: string) {
  const userId = await sesionUsuario();
  if (!userId) return false;
  return esDuenoMascota(mascotaId, userId);
}
