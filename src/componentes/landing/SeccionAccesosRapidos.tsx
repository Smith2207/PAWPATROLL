import { RUTAS_LANDING } from "@/lib/landing/rutas";
import Link from "next/link";

const ACCESOS = [
  {
    href: RUTAS_LANDING.casosActivos,
    icono: "🔍",
    titulo: "Casos activos",
    desc: "Fichas de mascotas perdidas con foto, datos y contacto.",
    tono: "orange",
  },
  {
    href: RUTAS_LANDING.comunidad,
    icono: "🗺️",
    titulo: "Comunidad",
    desc: "Mapa en vivo con zonas de búsqueda y avistamientos.",
    tono: "blue",
  },
  {
    href: RUTAS_LANDING.comoFunciona,
    icono: "ℹ️",
    titulo: "Cómo funciona",
    desc: "Guía paso a paso para dueños y vecinos colaboradores.",
    tono: "mint",
  },
] as const;

export function SeccionAccesosRapidos() {
  return (
    <section
      className="section-wrap pp-accesos-rapidos"
      aria-labelledby="accesos-rapidos-titulo"
    >
      <h2 id="accesos-rapidos-titulo" className="pp-accesos-rapidos-sr">
        Explora PawPatrol
      </h2>
      <div className="pp-accesos-rapidos-grid">
        {ACCESOS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`pp-acceso-card pp-acceso-card--${a.tono}`}
          >
            <span className="pp-acceso-icono" aria-hidden>
              {a.icono}
            </span>
            <span className="pp-acceso-texto">
              <strong>{a.titulo}</strong>
              <span>{a.desc}</span>
            </span>
            <span className="pp-acceso-flecha" aria-hidden>
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
