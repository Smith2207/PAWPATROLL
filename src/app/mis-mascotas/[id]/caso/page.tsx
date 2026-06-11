/**
 * Ruta /mis-mascotas/[id]/caso. Página principal de la ruta.
 */
import { auth } from "@/auth";
import { obtenerPanelCoordinacion } from "@/actions/casos";
import { VistaCoordinacion } from "@/componentes/casos/VistaCoordinacion";
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Centro de coordinación — PawPatroll",
};

export default async function PaginaCoordinacion({ params }: Props) {
  const sesion = await auth();
  if (!sesion?.user) redirect("/");

  const { id } = await params;
  const panel = await obtenerPanelCoordinacion(id);
  if (!panel) notFound();

  return (
    <EnvolturaPaginasApp>
      <VistaCoordinacion
        mascota={panel.mascota}
        avistamientos={panel.avistamientos}
        resumen={panel.resumen}
        miUserId={sesion.user.id!}
      />
    </EnvolturaPaginasApp>
  );
}
