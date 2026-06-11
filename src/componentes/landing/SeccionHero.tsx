"use client";



/**
 * [landing] Sección: hero.
 */
import type { EstadisticasLanding } from "@/actions/estadisticas";
import type { DatosMapaPublico } from "@/actions/mapa";
import { useModales } from "@/contexto/ContextoModales";
import { RUTAS_LANDING } from "@/lib/landing/rutas";
import Link from "next/link";
import { MapaVistaHero } from "@/componentes/landing/MapaVistaHero";
import { Icono } from "@/componentes/ui/Icono";

type Props = {
  estadisticas?: EstadisticasLanding;
  datosMapa?: DatosMapaPublico;
};

function formatear(n: number) {
  return n.toLocaleString("es-PE");
}

export function SeccionHero({ estadisticas, datosMapa }: Props) {
  const { abrirModal, abrirBusquedaPorFoto } = useModales();

  const perdidasEnMapa = datosMapa?.perdidas.length ?? 0;

  const hayDatos = Boolean(estadisticas);

  return (
    <div className="hero-wrap" id="inicio">
      <div className="hero-dots" />
      <div className="hero-blob hero-blob--1" aria-hidden />
      <div className="hero-blob hero-blob--2" aria-hidden />
      <div className="hero">
        <div>
          <div className="hero-badge">
            <span className="dot" />
            Comunidad activa · Puno y alrededores
          </div>
          <h1>
            Reúne a tu <span className="highlight">mascota perdida</span> con
            ayuda de la comunidad
          </h1>
          <p className="hero-desc">
            PawPatrol conecta dueños y vecinos con mapas y avistamientos. Si
            perdiste a tu mascota, activa la alerta; si la viste en la calle,
            repórtalo con ubicación.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => abrirModal("report")}
            >
              <Icono nombre="alerta" size={18} className="pp-icon--btn" />
              Perdí mi mascota
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => abrirModal("sighting")}
            >
              <Icono nombre="ojo" size={18} className="pp-icon--btn" />
              Vi una mascota
            </button>
          </div>
          <p className="hero-ayuda-foto">
            ¿Solo tienes una foto y quieres buscar coincidencias?{" "}
            <button
              type="button"
              className="hero-enlace-buscar"
              onClick={abrirBusquedaPorFoto}
            >
              Buscar por foto
            </button>
          </p>

          <div className="hero-enlaces-secundarios">
            <Link href={RUTAS_LANDING.casosActivos} className="hero-enlace-pagina">
              Ver casos activos
            </Link>
            <Link href={RUTAS_LANDING.comunidad} className="hero-enlace-pagina hero-enlace-pagina--mapa">
              Abrir mapa comunitario
            </Link>
          </div>

          {hayDatos && estadisticas && (
            <div className="hero-stats">
              <div className="stat stat--alerta">
                <div className="stat-num">
                  <span>{formatear(estadisticas.perdidasActivas)}</span>
                </div>
                <div className="stat-label">Casos activos</div>
              </div>
              <div className="stat stat--ok">
                <div className="stat-num">
                  <span>{formatear(estadisticas.reunidas)}</span>
                </div>
                <div className="stat-label">Reunidas</div>
              </div>
              <div className="stat stat--avist">
                <div className="stat-num">
                  <span>{formatear(estadisticas.avistamientos)}</span>
                </div>
                <div className="stat-label">Avistamientos</div>
              </div>
              <div className="stat stat--comunidad">
                <div className="stat-num">
                  <span>{formatear(estadisticas.usuarios)}</span>
                </div>
                <div className="stat-label">Personas registradas</div>
              </div>
            </div>
          )}
        </div>

        <div className="hero-visual">
          <div className="map-card">
            <div className="map-topbar">
              <span className="map-topbar-title">Vista del mapa</span>
              {perdidasEnMapa > 0 && (
                <div className="live-badge">
                  <span className="live-dot" />
                  {formatear(perdidasEnMapa)} perdida
                  {perdidasEnMapa === 1 ? "" : "s"}
                </div>
              )}
            </div>
            <div className="map-bg map-bg--real">
              {datosMapa ? (
                <MapaVistaHero datos={datosMapa} />
              ) : (
                <div className="map-bg map-bg--cargando" aria-hidden="true">
                  <div className="map-grid" />
                </div>
              )}
            </div>
            <div className="map-legend-row">
              <div className="map-legend">
                <div className="legend-item">
                  <div
                    className="legend-dot"
                    style={{ background: "var(--orange)" }}
                  />
                  Donde se perdió
                </div>
              </div>
              {perdidasEnMapa > 0 && (
                <Link href={RUTAS_LANDING.comunidad} className="map-ir-completo">
                  Ver mapa completo
                  <Icono nombre="derecha" size={16} className="pp-icon--btn" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
