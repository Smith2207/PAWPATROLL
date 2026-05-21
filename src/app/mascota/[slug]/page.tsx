import { obtenerMascotaPublica } from "@/actions/mascotas";
import { FichaPublicaMascota } from "@/componentes/mascotas/FichaPublicaMascota";
import { notFound } from "next/navigation";
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const datos = await obtenerMascotaPublica(slug);
  if (!datos) return { title: "Mascota no encontrada — PawPatrol" };

  return {
    title: `${datos.mascota.nombre} — PawPatrol`,
    description: `Ficha pública de ${datos.mascota.nombre}, ${datos.mascota.tipo}.`,
  };
}

export default async function PaginaFichaPublicaMascota({ params }: Props) {
  const { slug } = await params;
  const datos = await obtenerMascotaPublica(slug);

  if (!datos) notFound();

  return (
    <EnvolturaPaginasApp>
      <FichaPublicaMascota datos={datos} />
    </EnvolturaPaginasApp>
  );
}
