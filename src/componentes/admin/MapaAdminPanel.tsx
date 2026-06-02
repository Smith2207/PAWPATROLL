"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.heat";
import type { DatosMapaPublico } from "@/actions/mapa";
import { configurarIconosLeaflet } from "@/lib/geo/leaflet-iconos";
import { CENTRO_MAPA_DEFECTO } from "@/lib/geo/tipos";

type Props = {
  datos: DatosMapaPublico;
};

function contenedorVisible(el: HTMLElement | null): boolean {
  if (!el?.isConnected) return false;
  const { width, height } = el.getBoundingClientRect();
  return width >= 1 && height >= 1;
}

export function MapaAdminPanel({ datos }: Props) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const capasRef = useRef<L.LayerGroup | null>(null);
  const calorRef = useRef<L.Layer | null>(null);

  const totalPuntos =
    datos.puntosCalor.length + datos.perdidas.length + datos.avistamientos.length;
  const sinDatos = totalPuntos === 0;

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor || sinDatos) return;

    configurarIconosLeaflet();

    let cancelado = false;
    let mapa: L.Map | null = null;

    const init = () => {
      if (cancelado || mapaRef.current || !contenedorVisible(contenedor)) return;

      mapa = L.map(contenedor, {
        scrollWheelZoom: true,
        zoomControl: true,
      }).setView([CENTRO_MAPA_DEFECTO.lat, CENTRO_MAPA_DEFECTO.lng], 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(mapa);

      mapaRef.current = mapa;
      capasRef.current = L.layerGroup().addTo(mapa);

      pintarDatos();
    };

    const pintarDatos = () => {
      const m = mapaRef.current;
      const capas = capasRef.current;
      const el = contenedorRef.current;
      if (!m || !capas || !el) return;

      capas.clearLayers();
      if (calorRef.current) {
        m.removeLayer(calorRef.current);
        calorRef.current = null;
      }

      if (datos.puntosCalor.length > 0 && contenedorVisible(el)) {
        try {
          m.invalidateSize();
          calorRef.current = L.heatLayer(datos.puntosCalor, {
            radius: 32,
            blur: 24,
            maxZoom: 17,
            gradient: {
              0.2: "#3b82f6",
              0.5: "#eab308",
              0.8: "#f97316",
              1: "#ef4444",
            },
          }).addTo(m);
        } catch {
          /* canvas 0×0 */
        }
      }

      datos.perdidas.forEach((p) => {
        L.circleMarker([p.lat, p.lng], {
          radius: 8,
          color: "#ea580c",
          fillColor: "#f97316",
          fillOpacity: 0.9,
          weight: 2,
        })
          .bindPopup(
            `<strong>${p.nombre}</strong><br/>Pérdida activa${p.lugarPerdida ? `<br/>${p.lugarPerdida}` : ""}`
          )
          .addTo(capas);
      });

      datos.avistamientos.forEach((a) => {
        L.circleMarker([a.lat, a.lng], {
          radius: 6,
          color: "#1d4ed8",
          fillColor: "#3b82f6",
          fillOpacity: 0.85,
          weight: 2,
        })
          .bindPopup(
            `<strong>Avistamiento #${a.numeroReporte}</strong>${a.nombreMascota ? `<br/>${a.nombreMascota}` : ""}`
          )
          .addTo(capas);
      });

      const bounds: L.LatLngExpression[] = [];
      datos.perdidas.forEach((p) => bounds.push([p.lat, p.lng]));
      datos.avistamientos.forEach((a) => bounds.push([a.lat, a.lng]));

      if (bounds.length > 1) {
        m.fitBounds(L.latLngBounds(bounds), { padding: [36, 36], maxZoom: 14 });
      } else if (bounds.length === 1) {
        m.setView(bounds[0], 14);
      }

      window.setTimeout(() => {
        if (!m || !el) return;
        m.invalidateSize();
        if (!calorRef.current && datos.puntosCalor.length > 0 && contenedorVisible(el)) {
          try {
            calorRef.current = L.heatLayer(datos.puntosCalor, {
              radius: 32,
              blur: 24,
              maxZoom: 17,
              gradient: {
                0.2: "#3b82f6",
                0.5: "#eab308",
                0.8: "#f97316",
                1: "#ef4444",
              },
            }).addTo(m);
          } catch {
            /* reintento fallido */
          }
        }
      }, 150);
    };

    init();

    const ro = new ResizeObserver(() => {
      if (!mapaRef.current) {
        init();
        return;
      }
      mapaRef.current.invalidateSize();
      if (!calorRef.current && datos.puntosCalor.length > 0) {
        pintarDatos();
      }
    });
    ro.observe(contenedor);

    return () => {
      cancelado = true;
      ro.disconnect();
      if (calorRef.current && mapaRef.current) {
        mapaRef.current.removeLayer(calorRef.current);
      }
      mapaRef.current?.remove();
      mapaRef.current = null;
      capasRef.current = null;
      calorRef.current = null;
    };
  }, [datos, sinDatos]);

  if (sinDatos) {
    return (
      <div className="admin-mapa-vacio">
        <p>No hay pérdidas ni avistamientos con ubicación para mostrar en el mapa.</p>
      </div>
    );
  }

  return (
    <div className="admin-mapa-panel">
      <div className="admin-mapa-stats">
        <span>
          <i className="admin-mapa-dot admin-mapa-dot--perdida" />
          {datos.perdidas.length} perdida{datos.perdidas.length !== 1 ? "s" : ""}
        </span>
        <span>
          <i className="admin-mapa-dot admin-mapa-dot--avist" />
          {datos.avistamientos.length} avistamiento
          {datos.avistamientos.length !== 1 ? "s" : ""}
        </span>
        <span>
          <i className="admin-mapa-dot admin-mapa-dot--calor" />
          Mapa de calor activo
        </span>
      </div>
      <div ref={contenedorRef} className="admin-mapa-canvas" role="application" aria-label="Mapa de calor administrativo" />
      <p className="admin-mapa-leyenda">
        Naranja = pérdidas activas · Azul = avistamientos · Gradiente = densidad
      </p>
    </div>
  );
}
