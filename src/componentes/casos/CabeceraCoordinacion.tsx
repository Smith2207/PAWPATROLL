"use client";



/**
 * [casos] Componente React: cabecera coordinacion.
 */
/**
 * [casos] Componente React: cabecera coordinacion.
 */
import { Icono, iconoPorTipoMascota } from "@/componentes/ui/Icono";

export type MascotaCabeceraCoordinacion = {
  nombre: string;
  tipo: string;
  slug: string;
  fotoPrincipal: string | null;
};

type Resumen = {
  totalAvistamientos: number;
  ultimoAvistamientoDireccion: string | null;
};

type Props = {
  mascota: MascotaCabeceraCoordinacion;
  resumen: Resumen;
  onMarcarEncontrado?: () => void;
  marcando?: boolean;
};

function truncar(texto: string, max = 48) {
  const t = texto.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export function CabeceraCoordinacion({
  mascota,
  resumen,
  onMarcarEncontrado,
  marcando,
}: Props) {
  const iconoMascota = iconoPorTipoMascota(mascota.tipo);
  /** Mapa con cerco y avistamientos de esta mascota (sección en ficha pública). */
  const urlMapa = `/mascota/${mascota.slug}#mapa-mascota`;

  function compartir() {
    const enlace = `${window.location.origin}/mascota/${mascota.slug}`;
    if (navigator.share) {
      void navigator.share({
        title: `Ayuda a encontrar a ${mascota.nombre}`,
        url: enlace,
      });
    } else {
      void navigator.clipboard.writeText(enlace);
      alert("Enlace copiado al portapapeles.");
    }
  }

  return (
    <header className="pp-coord-cabecera">
      <div className="pp-coord-cabecera-principal">
        <span className="pp-coord-cabecera-foto">
          {mascota.fotoPrincipal ? (
            <img src={mascota.fotoPrincipal} alt="" width={52} height={52} />
          ) : (
            <span className="pp-coord-cabecera-foto-icono" aria-hidden>
              <Icono nombre={iconoMascota} size={28} />
            </span>
          )}
        </span>
        <div className="pp-coord-cabecera-info">
          <div className="pp-coord-cabecera-titulo">
            <h1>{mascota.nombre.toUpperCase()}</h1>
            <span className="pp-coord-estado pp-coord-estado--activa">
              En búsqueda activa
            </span>
          </div>
          <ul className="pp-coord-cabecera-meta">
            {resumen.ultimoAvistamientoDireccion && (
              <li>
                <Icono nombre="ubicacion" size={14} className="pp-coord-meta-icono" />
                Último avistamiento: {truncar(resumen.ultimoAvistamientoDireccion)}
              </li>
            )}
            <li>
              <Icono nombre="objetivo" size={14} className="pp-coord-meta-icono" />
              {resumen.totalAvistamientos} avistamientos registrados
            </li>
          </ul>
        </div>
      </div>
      <div className="pp-coord-cabecera-acciones">
        <a href={`/mascota/${mascota.slug}`} className="pp-coord-btn">
          Ver mascota
        </a>
        <a href={urlMapa} className="pp-coord-btn">
          Ver mapa
        </a>
        <button
          type="button"
          className="pp-coord-btn pp-coord-btn--compartir"
          onClick={compartir}
        >
          Compartir
        </button>
        {onMarcarEncontrado && (
          <button
            type="button"
            className="pp-coord-btn pp-coord-btn--primario"
            disabled={marcando}
            onClick={onMarcarEncontrado}
          >
            Marcar encontrado
          </button>
        )}
      </div>
    </header>
  );
}
