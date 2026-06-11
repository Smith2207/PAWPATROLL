"use client";

import { useCallback, useMemo, useState } from "react";
import { listarDatosMapaPublico, type DatosMapaPublico } from "@/actions/mapa";
import { FiltrosMapa } from "@/componentes/mapa/FiltrosMapa";
import { MapaPawPatrolSeccion } from "@/componentes/mapa/MapaPawPatrolLazy";
import { useGeolocalizacion } from "@/hooks/useGeolocalizacion";
import { useSolicitudUbicacion } from "@/hooks/useSolicitudUbicacion";
import { useTiempoRealConRespaldo } from "@/hooks/useTiempoRealConRespaldo";
import type { FiltrosMapaPublico } from "@/lib/mapa/filtros";
import type { UbicacionSeleccionada } from "@/lib/geo/tipos";

type Props = {
  datos: DatosMapaPublico;
  sinEncabezado?: boolean;
  /** Bloque del mapa más estrecho y centrado (p. ej. /comunidad) */
  centrado?: boolean;
};

export function SeccionMapa({
  datos: datosIniciales,
  sinEncabezado = false,
  centrado = false,
}: Props) {
  const [datos, setDatos] = useState(datosIniciales);
  const [filtros, setFiltros] = useState<FiltrosMapaPublico>({});
  const [miUbicacion, setMiUbicacion] = useState<UbicacionSeleccionada | null>(
    null
  );
  const geo = useGeolocalizacion({
    onUbicacion: setMiUbicacion,
  });
  const { solicitarUbicacion, dialogoPermiso } = useSolicitudUbicacion({
    obtenerUbicacion: geo.obtenerUbicacion,
  });

  const actualizar = useCallback(async (f: FiltrosMapaPublico = filtros) => {
    setDatos(await listarDatosMapaPublico(f));
  }, [filtros]);

  const aplicarFiltros = useCallback(
    (f: FiltrosMapaPublico) => {
      setFiltros(f);
      void actualizar(f);
    },
    [actualizar]
  );

  useTiempoRealConRespaldo(
    ["mapa"],
    (evento) => {
      if (
        evento.tipo === "mapa:actualizado" ||
        evento.tipo === "avistamiento:nuevo" ||
        evento.tipo === "avistamiento:actualizado"
      ) {
        void actualizar();
      }
    },
    () => {
      void actualizar();
    }
  );

  const datosMapa = useMemo(
    (): DatosMapaPublico => ({
      perdidas: datos.perdidas,
      avistamientos: [],
      puntosCalor: [],
    }),
    [datos.perdidas]
  );

  const totalPerdidas = datosMapa.perdidas.length;

  return (
    <section
      className={`seccion-mapa-wrap${centrado ? " seccion-mapa-wrap--centrado" : ""}`}
      id="mapa"
    >
      {!sinEncabezado && (
        <div className="seccion-mapa-header">
          <h2>Mapa de la comunidad</h2>
          <p>
            Cada icono marca <strong>dónde se perdió</strong> una mascota. Las
            zonas de búsqueda, avistamientos y refugios probables están en la{" "}
            <strong>página de cada mascota</strong>.
          </p>
        </div>
      )}

      <div className="pp-mapa-envoltorio-filtros">
        <MapaPawPatrolSeccion
          datos={datosMapa}
          altura="seccion"
          vista="solo-perdidas"
          mostrarCalor={false}
          mostrarCercos={false}
          mostrarRefugios={false}
          marcadorUsuario={miUbicacion}
          centrarEnUsuario={miUbicacion ?? undefined}
          mostrarBotonGeolocalizar
          geolocalizando={geo.cargando}
          onGeolocalizar={() => {
            void solicitarUbicacion();
          }}
        />
        <div className="pp-mapa-filtros-flotante">
          <FiltrosMapa
            filtros={filtros}
            onChange={aplicarFiltros}
            soloPerdidas
            variante="sobre-mapa"
            conteo={
              <>
                {totalPerdidas} mascota{totalPerdidas === 1 ? "" : "s"} en el mapa
              </>
            }
          />
        </div>
      </div>
      {dialogoPermiso}
    </section>
  );
}
