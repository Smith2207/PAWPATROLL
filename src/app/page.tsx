import { obtenerEstadisticasLanding } from "@/actions/estadisticas";
import { listarDatosMapaPublico } from "@/actions/mapa";
import { ContenedorPublico } from "@/componentes/landing/ContenedorPublico";
import { RedireccionHashLegacy } from "@/componentes/landing/RedireccionHashLegacy";
import { SeccionHero } from "@/componentes/landing/SeccionHero";
import { conTimeout } from "@/lib/utilidades/timeout";
import type { DatosMapaPublico } from "@/actions/mapa";

export const dynamic = "force-dynamic";

export default async function PaginaInicio() {
  let datosMapa: DatosMapaPublico = {
    perdidas: [],
    avistamientos: [],
    puntosCalor: [],
  };
  let estadisticas = {
    usuarios: 0,
    perdidasActivas: 0,
    reunidas: 0,
    avistamientos: 0,
  };
  let errorCarga = false;

  try {
    [datosMapa, estadisticas] = await Promise.all([
      conTimeout(listarDatosMapaPublico(), 8000),
      conTimeout(obtenerEstadisticasLanding(), 8000),
    ]);
  } catch {
    errorCarga = true;
  }

  return (
    <ContenedorPublico errorCarga={errorCarga}>
      <RedireccionHashLegacy />
      <SeccionHero estadisticas={estadisticas} datosMapa={datosMapa} />
    </ContenedorPublico>
  );
}
