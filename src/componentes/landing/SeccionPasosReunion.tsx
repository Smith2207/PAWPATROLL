const PASOS = [
  {
    num: "01",
    icono: "📋",
    titulo: "Crea tu reporte",
    desc: "Registra los datos de tu mascota: nombre, raza, fotos, descripción física, fecha y ubicación exacta de la pérdida.",
  },
  {
    num: "02",
    icono: "🤖",
    titulo: "La IA entra en acción",
    desc: "Nuestros modelos CNN analizan las fotos, identifican rasgos únicos y buscan coincidencias en la base de datos automáticamente.",
  },
  {
    num: "03",
    icono: "🔔",
    titulo: "Alertas a la comunidad",
    desc: "Usuarios cercanos reciben notificaciones automáticas. Cualquier ciudadano puede reportar avistamientos con foto y ubicación GPS.",
  },
  {
    num: "04",
    icono: "🎉",
    titulo: "¡Reunión exitosa!",
    desc: "El dueño y quien avistó la mascota se conectan por chat seguro. El estado del reporte cambia a Reunido y el caso se cierra.",
  },
] as const;

export function SeccionPasosReunion() {
  return (
    <div className="steps-section" id="comunidad">
      <div className="steps-inner">
        <div className="section-header section-header--izq">
          <div
            className="section-eyebrow"
            style={{
              background: "rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.8)",
            }}
          >
            Comunidad colaborativa
          </div>
          <div className="section-title" style={{ color: "white" }}>
            La red ciudadana que ayuda a reunir familias 🐾
          </div>
          <p
            className="section-sub"
            style={{ color: "rgba(255,255,255,0.72)", textAlign: "left" }}
          >
            Vecinos, voluntarios y dueños conectados con alertas, avistamientos y chat seguro
          </p>
        </div>
        <div className="steps-grid">
          {PASOS.map((p) => (
            <div key={p.num} className="step-card">
              <div className="step-num">{p.num}</div>
              <div className="step-icon">{p.icono}</div>
              <div className="step-title">{p.titulo}</div>
              <div className="step-desc">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
