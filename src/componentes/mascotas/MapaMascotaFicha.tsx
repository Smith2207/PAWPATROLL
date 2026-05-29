"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { DatosMapaMascota } from "@/actions/mapa";
import { useGeolocalizacion } from "@/hooks/useGeolocalizacion";
import type { UbicacionSeleccionada } from "@/lib/geo/tipos";
import { BotonReportarAvistamiento } from "@/componentes/mascotas/BotonReportarAvistamiento";
import { useRespaldoActualizacion } from "@/hooks/useRespaldoActualizacion";
import { useTiempoReal } from "@/hooks/useTiempoReal";
import { listarDatosMapaMascota } from "@/actions/mapa";

const MapaPawPatrol = dynamic(
  () =>
    import("@/componentes/mapa/MapaPawPatrol").then((m) => ({
      default: m.MapaPawPatrol,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="pp-mapa-wrap">
        <div className="pp-mapa pp-mapa--ficha" style={{ background: "#e8f4f8" }} />
      </div>
    ),
  }
);

type Props = {
  nombre: string;
  mascotaId: string;
  tipo?: string;
  color?: string | null;
  raza?: string | null;
  datos: DatosMapaMascota;
};

export function MapaMascotaFicha({
  nombre,
  mascotaId,
  tipo,
  color,
  raza,
  datos,
}: Props) {
  const router = useRouter();
  const [datosMapa, setDatosMapa] = useState(datos);
  const [miUbicacion, setMiUbicacion] = useState<UbicacionSeleccionada | null>(
    null
  );
  const geo = useGeolocalizacion({ onUbicacion: setMiUbicacion });

  const actualizarMapa = useCallback(async () => {
    const nuevos = await listarDatosMapaMascota(mascotaId);
    setDatosMapa(nuevos);
    router.refresh();
  }, [mascotaId, router]);

  const { conectado: wsConectado } = useTiempoReal([`mascota:${mascotaId}`], (evento) => {
    if (
      evento.tipo === "avistamiento:nuevo" ||
      evento.tipo === "avistamiento:actualizado"
    ) {
      if (evento.mascotaId && evento.mascotaId !== mascotaId) return;
      void actualizarMapa();
    }
    if (evento.tipo === "mensaje:nuevo" && evento.mascotaId === mascotaId) {
      void actualizarMapa();
    }
  });

  useRespaldoActualizacion(() => {
    void actualizarMapa();
  }, wsConectado);

  const tieneZonaPerdida = datosMapa.perdidas.length > 0;
  const totalAvistamientos = datosMapa.avistamientos.length;
  const tieneMapa = tieneZonaPerdida || totalAvistamientos > 0;

  return (
    <section
      className="ficha-publica-mapa"
      id="mapa-mascota"
      aria-labelledby="mapa-mascota-titulo"
    >
      <div className="ficha-publica-mapa-cabecera">
        <div>
          <h2 id="mapa-mascota-titulo" className="ficha-publica-mapa-titulo">
            🗺️ Mapa de {nombre}
          </h2>
          <p className="ficha-publica-mapa-desc">
            El cerco naranja crece y se desplaza según los avistamientos. Refugios
            probables y ruta <strong>solo de {nombre}</strong>.
          </p>
        </div>
        {totalAvistamientos > 0 && (
          <span className="ficha-publica-mapa-badge">
            {totalAvistamientos} avist.
          </span>
        )}
      </div>

      {!tieneMapa ? (
        <>
          <p className="ficha-publica-mapa-alerta">
            Aún no hay punto de pérdida en el mapa ni avistamientos vinculados a{" "}
            {nombre}. El dueño puede marcar la ubicación al reportar la pérdida.
          </p>
          <BotonReportarAvistamiento
            mascotaId={mascotaId}
            nombre={nombre}
            tipo={tipo}
            color={color}
            raza={raza}
            className="ficha-publica-mapa-btn"
          >
            👁️ Reportar avistamiento
          </BotonReportarAvistamiento>
        </>
      ) : (
        <>
          <div className="ficha-publica-mapa-leyenda" aria-hidden>
            {tieneZonaPerdida && (
              <>
                <span title="Cerco de búsqueda (M5)">
                  <i style={{ background: "var(--orange)" }} /> Cerco
                </span>
                <span title="Radio base">
                  <i style={{ background: "#94a3b8" }} /> Base
                </span>
                <span title="Refugios probables">
                  <i style={{ background: "#818cf8" }} /> 🏠 Refugio
                </span>
              </>
            )}
            <span title="Avistamientos de esta mascota">
              <i style={{ background: "var(--mint)" }} /> #N avist.
            </span>
          </div>

          <MapaPawPatrol
            datos={datosMapa}
            prediccion={datosMapa.prediccion}
            mascotaId={mascotaId}
            nombreMascota={nombre}
            altura="ficha"
            mostrarCalor={totalAvistamientos > 1}
            mostrarCercos={tieneZonaPerdida}
            mostrarRefugios={tieneZonaPerdida}
            marcadorUsuario={miUbicacion}
            centrarEnUsuario={miUbicacion ?? undefined}
            mostrarBotonGeolocalizar
            geolocalizando={geo.cargando}
            onGeolocalizar={() => {
              void geo.obtenerUbicacion();
            }}
          />
        </>
      )}
    </section>
  );
}
