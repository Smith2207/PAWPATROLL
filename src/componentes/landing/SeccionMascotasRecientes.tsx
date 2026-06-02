"use client";

import { useModales } from "@/contexto/ContextoModales";
import { BadgeEstadoMascota } from "@/componentes/mascotas/BadgeEstadoMascota";
import { Icono, iconoPorTipoMascota } from "@/componentes/ui/Icono";
import { esTipoMascotaPermitido } from "@/lib/mascotas/tipos";
import type { EstadoMascota } from "@/lib/db/schema";

export type MascotaPublicaTarjeta = {
  id: string;
  slug: string;
  nombre: string;
  tipo: string;
  raza: string | null;
  sexo: string | null;
  edad: string | null;
  color: string | null;
  estado: EstadoMascota;
  lugarPerdida: string | null;
  fechaPerdida: Date | null;
  updatedAt: Date;
  fotoPrincipal: string | null;
};

type Props = {
  mascotas: MascotaPublicaTarjeta[];
  /** @deprecated Usar mensajeVacio */
  mensajeBusqueda?: string | null;
  sinEncabezadoSeccion?: boolean;
  modoPaginaCasos?: boolean;
  busquedaActiva?: boolean;
  mensajeVacio?: string;
  onQuitarFiltros?: () => void;
};

function tiempoRelativo(fecha: Date) {
  const diff = Date.now() - new Date(fecha).getTime();
  const horas = Math.floor(diff / 3_600_000);
  if (horas < 1) return "hace unos minutos";
  if (horas < 24) return `hace ${horas}h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias}d`;
}

export function SeccionMascotasRecientes({
  mascotas,
  mensajeBusqueda,
  sinEncabezadoSeccion = false,
  modoPaginaCasos = false,
  busquedaActiva = false,
  mensajeVacio,
  onQuitarFiltros,
}: Props) {
  const { abrirModal } = useModales();
  const lista = mascotas.filter((m) => esTipoMascotaPermitido(m.tipo));
  const textoVacio =
    mensajeVacio ?? mensajeBusqueda ?? "No hay casos para mostrar.";

  return (
    <div className="section-wrap" id="casos-activos" style={{ paddingTop: 0 }}>
      {!sinEncabezadoSeccion && !modoPaginaCasos && (
        <div
          className="section-header section-header--izq"
          style={{ marginBottom: "1.8rem" }}
        >
          <div className="section-eyebrow">Comunidad</div>
          <div className="section-title">Mascotas perdidas y en seguimiento</div>
          <p className="section-sub">
            Fichas públicas activas. Para reportar dónde viste una, usa «Vi una
            mascota».
          </p>
        </div>
      )}

      <div className="pets-header">
        {!modoPaginaCasos && <h2>Casos activos</h2>}
        {modoPaginaCasos && lista.length > 0 && (
          <p className="pp-casos-contador" role="status">
            {lista.length === 1
              ? "1 caso activo"
              : `${lista.length} casos activos`}
          </p>
        )}
        <button
          type="button"
          className="see-all pp-enlace-icono"
          style={{ background: "none", border: "none", font: "inherit" }}
          onClick={() => abrirModal("sighting")}
        >
          Vi una mascota
          <Icono nombre="derecha" size={14} />
        </button>
      </div>

      {lista.length === 0 ? (
        <div className="pp-casos-vacio" role="status">
          <p>{textoVacio}</p>
          {busquedaActiva && onQuitarFiltros && (
            <button
              type="button"
              className="btn-mascota btn-mascota--secundario pp-casos-vacio-btn"
              onClick={onQuitarFiltros}
            >
              Ver todos los casos
            </button>
          )}
        </div>
      ) : (
        <div className="pets-grid">
          {lista.map((m) => {
            const iconoTipo = iconoPorTipoMascota(m.tipo);
            return (
              <a
                key={m.id}
                href={`/mascota/${m.slug}`}
                className="pet-card"
              >
                <div
                  className="pet-photo"
                  style={{
                    background: m.fotoPrincipal
                      ? undefined
                      : "linear-gradient(135deg,#FFF5EC,#FFEAD5)",
                  }}
                >
                  {m.fotoPrincipal ? (
                    <img
                      src={m.fotoPrincipal}
                      alt={m.nombre}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        position: "absolute",
                        inset: 0,
                      }}
                    />
                  ) : (
                    <Icono nombre={iconoTipo} size={48} />
                  )}
                  <div className="time-pill">{tiempoRelativo(m.updatedAt)}</div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 10,
                      left: 10,
                      zIndex: 2,
                    }}
                  >
                    <BadgeEstadoMascota estado={m.estado} />
                  </div>
                </div>
                <div className="pet-info">
                  <div className="pet-name">{m.nombre}</div>
                  <div className="pet-breed">
                    {m.tipo}
                    {m.raza ? ` · ${m.raza}` : ""}
                    {m.edad ? ` · ${m.edad}` : ""}
                  </div>
                  {m.lugarPerdida && (
                    <div className="pet-location">
                      <Icono nombre="ubicacion" size={14} className="pp-icon--btn" />{" "}
                      {m.lugarPerdida}
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
