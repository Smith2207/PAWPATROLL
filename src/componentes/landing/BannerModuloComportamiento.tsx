const ETIQUETAS = [
  "📏 Distancia probable recorrida",
  "🏠 Zonas de refugio probable",
  "👋 Reacción ante extraños",
  "⏰ Horarios de actividad",
  "💡 Consejos personalizados",
] as const;

export function BannerModuloComportamiento() {
  return (
    <div className="section-wrap" style={{ paddingTop: "2rem" }}>
      <div className="behavior-banner">
        <div>
          <div className="behavior-title">
            🧠 Módulo de Comportamiento Animal
          </div>
          <div className="behavior-desc">
            Basado en el perfil de tu mascota, PawPatrol analiza cómo se
            comportaría un perro perdido según su raza, tamaño, edad y
            personalidad. Genera predicciones de dónde podría estar y cómo
            acercarse a él.
          </div>
          <div className="behavior-tags">
            {ETIQUETAS.map((t) => (
              <span key={t} className="behavior-tag">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="behavior-visual">🐕‍🦺</div>
      </div>
    </div>
  );
}
