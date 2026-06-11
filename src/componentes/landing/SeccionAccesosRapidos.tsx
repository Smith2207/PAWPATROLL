/**
 * [landing] Sección: accesos rapidos.
 */
import { Icono, type NombreIcono } from "@/componentes/ui/Icono";
import { RUTAS_LANDING } from "@/lib/landing/rutas";
import Link from "next/link";

const ACCESOS: {
  href: string;
  icono: NombreIcono;
  titulo: string;
  desc: string;
  tono: "orange" | "blue" | "mint";
}[] = [
  {
    href: RUTAS_LANDING.casosActivos,
    icono: "buscar" as const,
    titulo: "Casos activos",
    desc: "Mascotas perdidas con foto, datos y contacto.",
    tono: "orange",
  },
  {
    href: RUTAS_LANDING.comunidad,
    icono: "mapa" as const,
    titulo: "Comunidad",
    desc: "Mapa en vivo con mascotas perdidas (punto donde se perdieron).",
    tono: "blue",
  },
  {
    href: RUTAS_LANDING.comoFunciona,
    icono: "info" as const,
    titulo: "Cómo funciona",
    desc: "Guía paso a paso para dueños y vecinos colaboradores.",
    tono: "mint",
  },
];

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
              <Icono nombre={a.icono} size={24} />
            </span>
            <span className="pp-acceso-texto">
              <strong>{a.titulo}</strong>
              <span>{a.desc}</span>
            </span>
            <span className="pp-acceso-flecha" aria-hidden>
              <Icono nombre="derecha" size={18} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
