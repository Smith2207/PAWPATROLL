"use client";



/**
 * [landing] Sección: cta final.
 */
import { useModales } from "@/contexto/ContextoModales";
import { Icono } from "@/componentes/ui/Icono";
import { RUTAS_LANDING } from "@/lib/landing/rutas";
import Link from "next/link";

export function SeccionCtaFinal() {
  const { abrirModal } = useModales();

  return (
    <section className="pp-home-cta-final" aria-labelledby="home-cta-final-titulo">
      <div className="pp-home-cta-final-inner">
        <h2 id="home-cta-final-titulo">Cada minuto cuenta</h2>
        <p>
          Activa tu alerta gratis o reporta un avistamiento. La comunidad de tu
          zona puede ayudarte hoy.
        </p>
        <div className="pp-home-cta-final-acciones">
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
            className="btn-secondary pp-home-cta-final-secundario"
            onClick={() => abrirModal("sighting")}
          >
            <Icono nombre="ojo" size={18} className="pp-icon--btn" />
            Vi una mascota
          </button>
        </div>
        <p className="pp-home-cta-final-links">
          <Link href={RUTAS_LANDING.casosActivos}>Ver casos activos</Link>
          <span aria-hidden>·</span>
          <Link href={RUTAS_LANDING.comunidad}>Mapa comunitario</Link>
          <span aria-hidden>·</span>
          <Link href={RUTAS_LANDING.comoFunciona}>Cómo funciona</Link>
        </p>
      </div>
    </section>
  );
}
