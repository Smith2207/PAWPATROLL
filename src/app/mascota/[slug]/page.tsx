import { obtenerMascotaPublica } from "@/actions/mascotas";
import { listarDatosMapaMascota } from "@/actions/mapa";
import {
  listarAvistamientosPorMascota,
  puedeGestionarAvistamientos,
} from "@/actions/avistamientos";
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

  const esPerdida = datos.mascota.estado === "PERDIDA";
  const datosMapa = esPerdida
    ? await listarDatosMapaMascota(datos.mascota.id)
    : null;
  const esDueno = esPerdida
    ? await puedeGestionarAvistamientos(datos.mascota.id)
    : false;
  const avistamientos = esPerdida
    ? await listarAvistamientosPorMascota(datos.mascota.id, {
        dueno: esDueno,
        incluirDescartados: esDueno,
      })
    : [];

  return (
    <EnvolturaPaginasApp>
      <FichaPublicaMascota
        datos={datos}
        datosMapa={datosMapa}
        avistamientos={avistamientos}
        esDueno={esDueno}
      />
    </EnvolturaPaginasApp>
  );
}
