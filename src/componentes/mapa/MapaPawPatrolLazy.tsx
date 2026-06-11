"use client";

import dynamic from "next/dynamic";

function MapaCargando({ altura }: { altura: "seccion" | "ficha" | "compacto" }) {
  if (altura === "compacto") {
    return <div className="pp-mapa pp-mapa--compacto" />;
  }

  return (
    <div className="pp-mapa-wrap">
      <div
        className={`pp-mapa pp-mapa--${altura}`}
        style={{ background: "#e8f4f8" }}
      />
    </div>
  );
}

function MapaHeroCargando() {
  return (
    <div className="map-bg map-bg--cargando" aria-hidden="true">
      <div className="map-grid" />
    </div>
  );
}

const importMapa = () =>
  import("@/componentes/mapa/MapaPawPatrol").then((m) => ({
    default: m.MapaPawPatrol,
  }));

const sinSsr = { ssr: false as const };

/** Mapa Leaflet con carga diferida — placeholder de sección (/comunidad, etc.) */
export const MapaPawPatrolSeccion = dynamic(importMapa, {
  ...sinSsr,
  loading: () => <MapaCargando altura="seccion" />,
});

/** Mapa en ficha individual de mascota */
export const MapaPawPatrolFicha = dynamic(importMapa, {
  ...sinSsr,
  loading: () => <MapaCargando altura="ficha" />,
});

/** Mapa compacto en formularios de ubicación */
export const MapaPawPatrolCompacto = dynamic(importMapa, {
  ...sinSsr,
  loading: () => <MapaCargando altura="compacto" />,
});

/** Mapa del hero de la landing */
export const MapaPawPatrolHero = dynamic(importMapa, {
  ...sinSsr,
  loading: () => <MapaHeroCargando />,
});
