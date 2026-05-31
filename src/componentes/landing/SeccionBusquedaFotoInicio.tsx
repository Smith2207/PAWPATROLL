"use client";

import { useModales } from "@/contexto/ContextoModales";

export function SeccionBusquedaFotoInicio() {
  const { abrirBusquedaPorFoto } = useModales();

  return (
    <section
      className="section-wrap pp-home-busqueda-foto"
      aria-labelledby="home-busqueda-foto-titulo"
    >
      <div className="pp-home-busqueda-foto-inner">
        <div>
          <div className="section-eyebrow">Búsqueda por foto</div>
          <h2 id="home-busqueda-foto-titulo" className="section-title">
            ¿Tienes una foto? Buscamos coincidencias
          </h2>
          <p className="section-sub pp-home-busqueda-foto-sub">
            Comparamos tu imagen con mascotas perdidas registradas. La IA orienta;
            la confirmación la hace la comunidad y el dueño.
          </p>
          <button
            type="button"
            className="btn-primary pp-home-busqueda-foto-btn"
            onClick={abrirBusquedaPorFoto}
          >
            📷 Buscar por foto
          </button>
        </div>
        <div className="pp-home-busqueda-foto-visual" aria-hidden>
          <div className="pp-home-busqueda-foto-demo">
            <span>📷</span>
            <span className="pp-home-busqueda-foto-flecha">→</span>
            <span>🐾</span>
          </div>
          <p>Se parece a estas mascotas reportadas</p>
        </div>
      </div>
    </section>
  );
}
