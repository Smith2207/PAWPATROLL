"use client";



/**
 * [geo] Componente React: dialogo permiso ubicacion.
 */
import { Icono } from "@/componentes/ui/Icono";
import type { EstadoPermisoUbicacion } from "@/lib/geo/permiso-ubicacion";

type Props = {
  abierto: boolean;
  estadoPermiso: EstadoPermisoUbicacion;
  cargando?: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
};

export function DialogoPermisoUbicacion({
  abierto,
  estadoPermiso,
  cargando = false,
  onConfirmar,
  onCerrar,
}: Props) {
  if (!abierto) return null;

  const bloqueado = estadoPermiso === "denied";

  return (
    <div className="pp-geo-dialogo" role="presentation">
      <button
        type="button"
        className="pp-geo-dialogo-overlay"
        aria-label="Cerrar"
        onClick={onCerrar}
      />
      <div
        className="pp-geo-dialogo-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pp-geo-dialogo-titulo"
      >
        <div className="pp-geo-dialogo-asidero" aria-hidden />

        <span className="pp-geo-dialogo-icono" aria-hidden>
          <Icono nombre={bloqueado ? "alertaCirculo" : "objetivo"} size={32} />
        </span>

        <h3 id="pp-geo-dialogo-titulo" className="pp-geo-dialogo-titulo">
          {bloqueado ? "Ubicación bloqueada" : "¿Usar tu ubicación actual?"}
        </h3>

        <p className="pp-geo-dialogo-texto">
          {bloqueado ? (
            <>
              El navegador tiene desactivado el acceso a tu GPS. Actívalo en los
              ajustes del sitio (icono del candado en la barra de direcciones) o
              marca el punto manualmente en el mapa.
            </>
          ) : (
            <>
              PawPatroll usará tu GPS para colocarte en el mapa y completar la
              dirección automáticamente. Solo se usa cuando tú lo confirmas.
            </>
          )}
        </p>

        <div className="pp-geo-dialogo-acciones">
          {!bloqueado && (
            <button
              type="button"
              className="pp-geo-dialogo-btn pp-geo-dialogo-btn--primario"
              disabled={cargando}
              onClick={onConfirmar}
            >
              {cargando ? (
                <>
                  <Icono nombre="reloj" size={18} />
                  Ubicando…
                </>
              ) : (
                <>
                  <Icono nombre="objetivo" size={18} />
                  Sí, usar mi ubicación
                </>
              )}
            </button>
          )}
          <button
            type="button"
            className={`pp-geo-dialogo-btn${bloqueado ? " pp-geo-dialogo-btn--primario" : ""}`}
            disabled={cargando}
            onClick={onCerrar}
          >
            {bloqueado ? "Entendido" : "Ahora no"}
          </button>
        </div>
      </div>
    </div>
  );
}
