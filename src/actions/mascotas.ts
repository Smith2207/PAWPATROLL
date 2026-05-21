"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mascotas } from "@/lib/db/schema";
import { puedeRegistrarMascotas } from "@/lib/auth/roles";
import type { ResultadoAuth } from "@/actions/autenticacion";

export async function listarMisMascotas() {
  const { auth } = await import("@/auth");
  const sesion = await auth();

  if (!sesion?.user?.id) return [];

  return db
    .select()
    .from(mascotas)
    .where(eq(mascotas.userId, sesion.user.id))
    .orderBy(desc(mascotas.createdAt));
}

export async function crearMascota(datos: {
  nombre: string;
  tipo: string;
  raza?: string;
  sexo?: string;
  color?: string;
}): Promise<ResultadoAuth> {
  const { auth } = await import("@/auth");
  const sesion = await auth();

  if (!sesion?.user?.id) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  if (!puedeRegistrarMascotas(sesion.user.rol)) {
    return {
      ok: false,
      error: "Tu rol no permite registrar mascotas. Usa el rol Dueño al registrarte.",
    };
  }

  const nombre = datos.nombre.trim();
  const tipo = datos.tipo.trim();

  if (!nombre || !tipo) {
    return { ok: false, error: "Nombre y tipo son obligatorios." };
  }

  await db.insert(mascotas).values({
    userId: sesion.user.id,
    nombre,
    tipo,
    raza: datos.raza?.trim() || null,
    sexo: datos.sexo?.trim() || null,
    color: datos.color?.trim() || null,
  });

  return { ok: true, mensaje: "Mascota registrada en tu perfil." };
}

export async function eliminarMascota(id: string): Promise<ResultadoAuth> {
  const { auth } = await import("@/auth");
  const sesion = await auth();

  if (!sesion?.user?.id) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  await db
    .delete(mascotas)
    .where(
      and(eq(mascotas.id, id), eq(mascotas.userId, sesion.user.id))
    );

  return { ok: true, mensaje: "Mascota eliminada." };
}
