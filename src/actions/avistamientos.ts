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
      slug: mascotas.slug,
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
    slugMascota: fila.slug,
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
      return { ok: false, error: "Ficha de mascota no válida." };
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
    void notificarDuenoAvistamiento(
      datos.mascotaId,
      insertado.numeroReporte,
      direccionLimpia
    );
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
  autorNombre?: string
): Promise<ResultadoAuth & { id?: string }> {
  const texto = contenido.trim();
  if (texto.length < 1) {
    return { ok: false, error: "Escribe un mensaje." };
  }
  if (texto.length > 2000) {
    return { ok: false, error: "Mensaje demasiado largo." };
  }

  const userId = await sesionUsuario();

  const [av] = await db
    .select({
      av: avistamientos,
      mascotaUserId: mascotas.userId,
      nombreMascota: mascotas.nombre,
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
  const invitadoConNombre =
    !userId && Boolean(autorNombre?.trim()) && !av.av.userId;

  if (!esDueno && !esReportante && !invitadoConNombre) {
    return {
      ok: false,
      error: "Inicia sesión o indica tu nombre para escribir al dueño.",
    };
  }

  const [insertado] = await db
    .insert(mensajesAvistamiento)
    .values({
      avistamientoId,
      userId,
      autorNombre: autorNombre?.trim() || null,
      contenido: texto,
    })
    .returning({ id: mensajesAvistamiento.id });

  emitirTiempoReal({
    tipo: "mensaje:nuevo",
    avistamientoId,
    mascotaId: av.av.mascotaId,
  });

  const nombreAutor =
    autorNombre?.trim() ||
    (esDueno ? av.nombreDueno : av.av.nombreReportante) ||
    "Un vecino";

  const emailDestino = esDueno
    ? null
    : av.emailDueno;
  const nombreDestino = esDueno ? null : av.nombreDueno;

  if (emailDestino && av.slug && av.nombreMascota) {
    void enviarCorreoMensajeChat({
      emailDestino,
      nombreDestino,
      nombreMascota: av.nombreMascota,
      slugMascota: av.slug,
      autorMensaje: nombreAutor ?? "Alguien",
      extracto: texto.slice(0, 200),
    });
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
