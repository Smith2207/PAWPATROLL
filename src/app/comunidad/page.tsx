import { listarDatosMapaPublico, type DatosMapaPublico } from "@/actions/mapa";
import {
  listarActividadComunidad,
  listarTopColaboradores,
} from "@/actions/comunidad";
import { ContenedorPublico } from "@/componentes/landing/ContenedorPublico";
import { EncabezadoPagina } from "@/componentes/landing/EncabezadoPagina";
import { SeccionMapa } from "@/componentes/landing/SeccionMapa";
import { SeccionFeedComunidad } from "@/componentes/comunidad/SeccionFeedComunidad";
import { conTimeout } from "@/lib/utilidades/timeout";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mapa comunitario — PawPatrol",
  description:
    "Mapa en vivo con mascotas perdidas. El detalle de cada caso está en su página.",
};

export default async function PaginaComunidad() {
  let datosMapa: DatosMapaPublico = {
    perdidas: [],
    avistamientos: [],
    puntosCalor: [],
  };
  let errorCarga = false;
  let actividad: Awaited<ReturnType<typeof listarActividadComunidad>> = [];
  let colaboradores: Awaited<ReturnType<typeof listarTopColaboradores>> = [];

  try {
    [datosMapa, actividad, colaboradores] = await Promise.all([
      conTimeout(listarDatosMapaPublico(), 8000),
      conTimeout(listarActividadComunidad(), 8000),
      conTimeout(listarTopColaboradores(), 8000),
    ]);
  } catch {
    errorCarga = true;
  }

  return (
    <ContenedorPublico errorCarga={errorCarga}>
      <div className="pp-comunidad-pagina">
        <EncabezadoPagina
          eyebrow="Mapa en vivo"
          titulo="Comunidad"
          descripcion="Ubicación de mascotas perdidas en el mapa. Zonas de búsqueda, avistamientos y refugios probables en la página de cada una."
        />
        <div className="pp-comunidad-cuerpo">
          <SeccionMapa datos={datosMapa} sinEncabezado centrado />
          <SeccionFeedComunidad
            actividad={actividad}
            colaboradores={colaboradores}
            lateral
          />
        </div>
      </div>
    </ContenedorPublico>
  );
}
