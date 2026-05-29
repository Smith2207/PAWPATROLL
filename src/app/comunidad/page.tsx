import { listarDatosMapaPublico } from "@/actions/mapa";
import { ContenedorPublico } from "@/componentes/landing/ContenedorPublico";
import { SeccionMapa } from "@/componentes/landing/SeccionMapa";
import { conTimeout } from "@/lib/utilidades/timeout";
import type { DatosMapaPublico } from "@/actions/mapa";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mapa comunitario — PawPatrol",
  description:
    "Mapa de mascotas perdidas, zonas de búsqueda y avistamientos de la comunidad.",
};

export default async function PaginaComunidad() {
  let datosMapa: DatosMapaPublico = {
    perdidas: [],
    avistamientos: [],
    puntosCalor: [],
  };
  let errorCarga = false;

  try {
    datosMapa = await conTimeout(listarDatosMapaPublico(), 8000);
  } catch {
    errorCarga = true;
  }

  return (
    <ContenedorPublico errorCarga={errorCarga}>
      <SeccionMapa datos={datosMapa} />
    </ContenedorPublico>
  );
}
