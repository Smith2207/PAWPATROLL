const CARACTERISTICAS = [
  {
    clase: "fc-orange",
    iconoClase: "fi-or",
    icono: "📸",
    titulo: "Reconocimiento por foto",
    desc: "Sube una foto de la mascota perdida. Nuestra IA analiza rasgos, color de pelaje, raza y marcas únicas para encontrar coincidencias en la base de datos con puntuación de similitud.",
    tag: "tag-or",
  },
  {
    clase: "fc-blue",
    iconoClase: "fi-bl",
    icono: "🗺️",
    titulo: "Mapa interactivo",
    desc: "Visualiza en tiempo real todos los avistamientos, la zona de pérdida y el radio estimado de búsqueda inteligente. Mapa de calor de zonas históricas incluido.",
    tag: "tag-bl",
  },
  {
    clase: "fc-blue",
    iconoClase: "fi-bl",
    icono: "🧠",
    titulo: "Análisis de comportamiento",
    desc: "Predicciones según raza y tamaño: distancia probable recorrida, zonas de refugio, horarios de actividad y consejos personalizados de búsqueda generados con ML.",
    tag: "tag-bl",
  },
  {
    clase: "fc-yellow",
    iconoClase: "fi-ye",
    icono: "🔔",
    titulo: "Alertas inteligentes",
    desc: "Notificaciones automáticas por correo a usuarios dentro del radio de búsqueda. Alertas al dueño cuando alguien reporta una coincidencia visual cercana.",
    tag: "tag-or",
  },
  {
    clase: "fc-purple",
    iconoClase: "fi-pu",
    icono: "💬",
    titulo: "Chat seguro con la comunidad",
    desc: "Conecta en tiempo real con quien avistó a tu mascota. Chat seguro y privado: tu número de teléfono nunca es público sin consentimiento mutuo.",
    tag: "tag-pu",
  },
  {
    clase: "fc-red",
    iconoClase: "fi-re",
    icono: "👥",
    titulo: "Red ciudadana colaborativa",
    desc: "Comunidad activa que reporta avistamientos con foto, ubicación GPS y descripción. Historial de avistamientos y línea de tiempo del desplazamiento de la mascota.",
    tag: "tag-bl",
  },
] as const;

export function SeccionCaracteristicas() {
  return (
    <div className="section-wrap" id="como-funciona">
      <div className="section-header section-header--izq">
        <div className="section-eyebrow">Tecnología de punta</div>
        <div className="section-title">¿Cómo funciona PawPatrol? 🤖</div>
        <p className="section-sub">
          Inteligencia artificial al servicio de quienes más amamos
        </p>
      </div>
      <div className="features-grid">
        {CARACTERISTICAS.map((c) => (
          <div key={c.titulo} className={`feature-card ${c.clase}`}>
            <div className={`feature-icon ${c.iconoClase}`}>{c.icono}</div>
            <div className="feature-title">{c.titulo}</div>
            <div className="feature-desc">{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
