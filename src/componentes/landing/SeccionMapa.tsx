"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { listarDatosMapaPublico, type DatosMapaPublico } from "@/actions/mapa";
import { FiltrosMapa } from "@/componentes/mapa/FiltrosMapa";
import { useGeolocalizacion } from "@/hooks/useGeolocalizacion";
import { useSolicitudUbicacion } from "@/hooks/useSolicitudUbicacion";
import { useTiempoRealConRespaldo } from "@/hooks/useTiempoRealConRespaldo";
import type { FiltrosMapaPublico } from "@/lib/mapa/filtros";
import type { UbicacionSeleccionada } from "@/lib/geo/tipos";
import { LeyendaMapaColapsable } from "@/componentes/mapa/LeyendaMapaColapsable";

const MapaPawPatrol = dynamic(
  () =>
    import("@/componentes/mapa/MapaPawPatrol").then((m) => ({
      default: m.MapaPawPatrol,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="pp-mapa-wrap">
        <div className="pp-mapa pp-mapa--seccion" style={{ background: "#e8f4f8" }} />
      </div>
    ),
  }
);

type Props = {
  datos: DatosMapaPublico;
  sinEncabezado?: boolean;
};

export function SeccionMapa({ datos: datosIniciales, sinEncabezado = false }: Props) {
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
    <section className="seccion-mapa-wrap" id="mapa">
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

      <FiltrosMapa filtros={filtros} onChange={aplicarFiltros} soloPerdidas />

      <div className="pp-mapa-controles">
        <LeyendaMapaColapsable
          items={[
            { color: "var(--orange)", texto: "Donde se perdió la mascota" },
          ]}
        />
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)" }}>
          {totalPerdidas} mascota{totalPerdidas === 1 ? "" : "s"} en el mapa
        </span>
      </div>

      <MapaPawPatrol
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
      {dialogoPermiso}
    </section>
  );
}
