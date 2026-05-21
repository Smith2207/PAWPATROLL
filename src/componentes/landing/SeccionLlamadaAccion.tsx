"use client";

import { useModales } from "@/contexto/ContextoModales";

export function SeccionLlamadaAccion() {
  const { abrirModal } = useModales();

  return (
    <div className="contenedor-cta">
      <div className="cta-section">
        <h2>¿Perdiste a tu mascota? Actúa ahora 🚨</h2>
        <p>
          Cada minuto cuenta. Reporta la pérdida, activa la red de búsqueda con IA
          <br />y conecta con tu comunidad en cuestión de segundos.
        </p>
        <div className="cta-buttons">
          <button
            type="button"
            className="btn-white"
            onClick={() => abrirModal("report")}
          >
            🐾 Reportar pérdida ahora
          </button>
          <button
            type="button"
            className="btn-outline-w"
            onClick={() => abrirModal("sighting")}
          >
            👁️ Reportar avistamiento
          </button>
        </div>
      </div>
    </div>
  );
}
