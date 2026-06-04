import { listarMascotasPerdidasPublicas } from "@/actions/mascotas";
import { ContenedorPublico } from "@/componentes/landing/ContenedorPublico";
import { PaginaCasosActivos } from "@/componentes/landing/PaginaCasosActivos";
import { conTimeout } from "@/lib/utilidades/timeout";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Casos activos — PawPatrol",
  description:
    "Busca y consulta mascotas perdidas con página pública activa en la comunidad.",
};

export default async function PaginaCasosActivosRoute() {
  let mascotas: Awaited<ReturnType<typeof listarMascotasPerdidasPublicas>> = [];
  let errorCarga = false;

  try {
    mascotas = await conTimeout(listarMascotasPerdidasPublicas(24), 8000);
  } catch {
    errorCarga = true;
  }

  return (
    <ContenedorPublico errorCarga={errorCarga}>
      <PaginaCasosActivos mascotasIniciales={mascotas} />
    </ContenedorPublico>
  );
}
