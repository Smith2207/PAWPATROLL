"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { listarDatosMapaPublico, type DatosMapaPublico } from "@/actions/mapa";
import { FiltrosMapa } from "@/componentes/mapa/FiltrosMapa";
import { useGeolocalizacion } from "@/hooks/useGeolocalizacion";
import { useRespaldoActualizacion } from "@/hooks/useRespaldoActualizacion";
import { useTiempoReal } from "@/hooks/useTiempoReal";
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

  useEffect(() => {
    const centrar = () => {
      void geo.obtenerUbicacion();
    };
    window.addEventListener("pawpatroll:centrar-mapa-usuario", centrar);
    return () =>
      window.removeEventListener("pawpatroll:centrar-mapa-usuario", centrar);
  }, [geo]);

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

  const { conectado: wsConectado } = useTiempoReal(["mapa"], (evento) => {
    if (
      evento.tipo === "mapa:actualizado" ||
      evento.tipo === "avistamiento:nuevo" ||
      evento.tipo === "avistamiento:actualizado"
    ) {
      void actualizar();
    }
  });

  useRespaldoActualizacion(() => {
    void actualizar();
  }, wsConectado);

  const totalActivos = datos.perdidas.length + datos.avistamientos.length;

  return (
    <section className="seccion-mapa-wrap" id="mapa">
      {!sinEncabezado && (
        <div className="seccion-mapa-header">
          <h2>Mapa de la comunidad</h2>
          <p>
            Cada mascota perdida tiene su <strong>zona de búsqueda</strong> (círculo
            de color) centrada donde se perdió, más los{" "}
            <strong>avistamientos</strong> reportados por la comunidad. Los refugios
            probables y el análisis detallado están en la{" "}
            <strong>ficha de cada mascota</strong>.
          </p>
        </div>
      )}

      <FiltrosMapa filtros={filtros} onChange={aplicarFiltros} />

      <div className="pp-mapa-controles">
        <LeyendaMapaColapsable
          items={[
            { color: "var(--orange)", texto: "🟠 Donde se perdió (zona de búsqueda)" },
            { color: "#2563eb", texto: "🔵 Avistamiento de otra mascota" },
            { color: "var(--mint)", texto: "🟢 Mismo color = misma mascota" },
          ]}
        />
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)" }}>
          {totalActivos} punto{totalActivos === 1 ? "" : "s"} en el mapa
        </span>
      </div>

      <MapaPawPatrol
        datos={datos}
        altura="seccion"
        mostrarCalor={false}
        mostrarCercos
        mostrarRefugios={false}
        cercoColorPorPerdida
        marcadorUsuario={miUbicacion}
        centrarEnUsuario={miUbicacion ?? undefined}
        mostrarBotonGeolocalizar
        geolocalizando={geo.cargando}
        onGeolocalizar={() => {
          void geo.obtenerUbicacion();
        }}
      />
    </section>
  );
}
