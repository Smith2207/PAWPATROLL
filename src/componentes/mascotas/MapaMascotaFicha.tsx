"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { DatosMapaMascota } from "@/actions/mapa";
import { useGeolocalizacion } from "@/hooks/useGeolocalizacion";
import { useSolicitudUbicacion } from "@/hooks/useSolicitudUbicacion";
import type { UbicacionSeleccionada } from "@/lib/geo/tipos";
import { BotonReportarAvistamiento } from "@/componentes/mascotas/BotonReportarAvistamiento";
import { useRespaldoActualizacion } from "@/hooks/useRespaldoActualizacion";
import { useTiempoReal } from "@/hooks/useTiempoReal";
import { listarDatosMapaMascota } from "@/actions/mapa";
import { LightboxMapaFicha } from "@/componentes/mascotas/LightboxMapaFicha";
import { Icono } from "@/componentes/ui/Icono";

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
  const [mapaAmpliado, setMapaAmpliado] = useState(false);
  const geo = useGeolocalizacion({ onUbicacion: setMiUbicacion });
  const { solicitarUbicacion, dialogoPermiso } = useSolicitudUbicacion({
    obtenerUbicacion: geo.obtenerUbicacion,
  });

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

  function abrirMapaAmpliado() {
    setMapaAmpliado(true);
  }

  function onClickVistaMapa(e: React.MouseEvent<HTMLDivElement>) {
    const objetivo = e.target as HTMLElement;
    if (
      objetivo.closest(
        ".leaflet-control, .pp-mapa-btn-geo, .ficha-publica-mapa-ampliar-btn, .leaflet-popup"
      )
    ) {
      return;
    }
    abrirMapaAmpliado();
  }

  const propsMapa = {
    datos: datosMapa,
    prediccion: datosMapa.prediccion,
    mascotaId,
    nombreMascota: nombre,
    mostrarCalor: false as const,
    mostrarCercos: tieneZonaPerdida,
    mostrarRefugios: tieneZonaPerdida,
    marcadorUsuario: miUbicacion,
    centrarEnUsuario: miUbicacion ?? undefined,
    mostrarBotonGeolocalizar: true as const,
    geolocalizando: geo.cargando,
    onGeolocalizar: () => {
      void solicitarUbicacion();
    },
  };

  return (
    <section
      className="ficha-publica-mapa ficha-publica-mapa--destacado"
      id="mapa-mascota"
      aria-labelledby="mapa-mascota-titulo"
    >
      <div className="ficha-publica-mapa-cabecera">
        <div>
          <h2 id="mapa-mascota-titulo" className="ficha-publica-mapa-titulo">
            Mapa de búsqueda
          </h2>
          <p className="ficha-publica-mapa-desc">
            Zona activa y avistamientos de <strong>{nombre}</strong>
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
          />
        </>
      ) : (
        <>
          <div className="ficha-publica-mapa-leyenda" aria-hidden>
            {tieneZonaPerdida && (
              <>
                <span className="ficha-publica-mapa-leyenda-pill ficha-publica-mapa-leyenda-pill--zona">
                  Zona de búsqueda
                </span>
                <span className="ficha-publica-mapa-leyenda-pill ficha-publica-mapa-leyenda-pill--base">
                  Área base
                </span>
                <span className="ficha-publica-mapa-leyenda-pill ficha-publica-mapa-leyenda-pill--refugio">
                  Refugio
                </span>
              </>
            )}
            <span className="ficha-publica-mapa-leyenda-pill ficha-publica-mapa-leyenda-pill--avist">
              Avistamientos
            </span>
          </div>

          <div
            className="ficha-publica-mapa-envoltorio ficha-publica-mapa-envoltorio--clic"
            onClick={onClickVistaMapa}
          >
            <MapaPawPatrol {...propsMapa} altura="ficha" />
            <button
              type="button"
              className="ficha-publica-mapa-ampliar-btn"
              onClick={(e) => {
                e.stopPropagation();
                abrirMapaAmpliado();
              }}
            >
              <Icono nombre="buscar" size={14} className="pp-icon--btn" />
              Clic para ampliar
            </button>
          </div>

          <LightboxMapaFicha
            abierto={mapaAmpliado}
            titulo={`Mapa de búsqueda — ${nombre}`}
            onCerrar={() => setMapaAmpliado(false)}
          >
            <MapaPawPatrol {...propsMapa} altura="seccion" />
            {dialogoPermiso}
          </LightboxMapaFicha>
          {!mapaAmpliado && dialogoPermiso}
        </>
      )}
    </section>
  );
}
