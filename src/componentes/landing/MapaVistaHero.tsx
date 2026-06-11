"use client";



/**
 * [landing] Mapa: vista hero.
 */
import { useMemo } from "react";
import type { DatosMapaPublico } from "@/actions/mapa";
import { MapaPawPatrolHero } from "@/componentes/mapa/MapaPawPatrolLazy";

type Props = {
  datos: DatosMapaPublico;
};

export function MapaVistaHero({ datos }: Props) {
  const datosSoloPerdidas = useMemo(
    (): DatosMapaPublico => ({
      perdidas: datos.perdidas,
      avistamientos: [],
      puntosCalor: [],
    }),
    [datos.perdidas]
  );

  const hayPerdidas = datosSoloPerdidas.perdidas.length > 0;

  if (!hayPerdidas) {
    return (
      <div className="map-bg map-bg--vacio" role="img" aria-label="Sin casos en el mapa">
        <div className="map-grid" />
        <p className="map-bg-vacio-texto">Sin mascotas perdidas con ubicación</p>
      </div>
    );
  }

  return (
    <MapaPawPatrolHero
      datos={datosSoloPerdidas}
      altura="hero"
      vista="solo-perdidas"
      mostrarCalor={false}
      mostrarCercos={false}
    />
  );
}
