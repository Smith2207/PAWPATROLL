import { Icono, type NombreIcono } from "@/componentes/ui/Icono";
import { RUTAS_LANDING } from "@/lib/landing/rutas";
import Link from "next/link";

const PASOS: {
  num: string;
  icono: NombreIcono;
  titulo: string;
  desc: string;
  tono: "orange" | "blue" | "mint";
}[] = [
  {
    num: "1",
    icono: "alerta" as const,
    titulo: "Activa la alerta",
    desc: "Nombre, foto y dónde se perdió. Publicamos tu ficha en segundos.",
    tono: "orange",
  },
  {
    num: "2",
    icono: "ojo" as const,
    titulo: "La comunidad reporta",
    desc: "Vecinos marcan en el mapa dónde la vieron, con foto si pueden.",
    tono: "blue",
  },
  {
    num: "3",
    icono: "celebracion" as const,
    titulo: "Te reunimos",
    desc: "Coordina por mensajes y marca el caso como reunido cuando vuelva.",
    tono: "mint",
  },
];

export function SeccionPasosInicio() {
  return (
    <section className="section-wrap pp-home-pasos" aria-labelledby="home-pasos-titulo">
      <div className="section-header">
        <div className="section-eyebrow">Así funciona</div>
        <h2 id="home-pasos-titulo" className="section-title">
          Tres pasos para volver a casa
        </h2>
        <p className="section-sub">
          Dueños y vecinos en la misma ciudad, con mapa y avistamientos en tiempo
          casi real.
        </p>
      </div>
      <div className="pp-home-pasos-grid">
        {PASOS.map((p) => (
          <article
            key={p.num}
            className={`pp-home-paso-card pp-home-paso-card--${p.tono}`}
          >
            <span className="pp-home-paso-num" aria-hidden>
              {p.num}
            </span>
            <span className="pp-home-paso-icono-wrap" aria-hidden>
              <span className="pp-home-paso-icono">
                <Icono nombre={p.icono} size={28} />
              </span>
            </span>
            <h3 className="pp-home-paso-titulo">{p.titulo}</h3>
            <p className="pp-home-paso-desc">{p.desc}</p>
          </article>
        ))}
      </div>
      <p className="pp-home-pasos-enlace">
        <Link href={RUTAS_LANDING.comoFunciona}>
          Ver guía completa con todas las funciones
          <Icono nombre="derecha" size={16} className="pp-icon--btn" />
        </Link>
      </p>
    </section>
  );
}
