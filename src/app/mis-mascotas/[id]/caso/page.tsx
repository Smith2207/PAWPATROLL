import { auth } from "@/auth";
import { obtenerCasoBusqueda } from "@/actions/casos";
import { VistaCasoBusqueda } from "@/componentes/casos/VistaCasoBusqueda";
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Caso de búsqueda — PawPatrol",
};

export default async function PaginaCasoBusqueda({ params }: Props) {
  const sesion = await auth();
  if (!sesion?.user) redirect("/");

  const { id } = await params;
  const caso = await obtenerCasoBusqueda(id);
  if (!caso) notFound();

  return (
    <EnvolturaPaginasApp>
      <VistaCasoBusqueda
        mascota={caso.mascota}
        eventos={caso.eventos}
        avistamientos={caso.avistamientos}
      />
    </EnvolturaPaginasApp>
  );
}
