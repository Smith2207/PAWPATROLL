const PASOS = [
  {
    num: "01",
    icono: "📋",
    titulo: "Crea la ficha",
    desc: "Registra nombre, fotos, raza y datos de contacto. Marca la mascota como perdida con fecha y punto en el mapa.",
  },
  {
    num: "02",
    icono: "🗺️",
    titulo: "Comparte y mapa",
    desc: "Publica el enlace de la ficha. Aparece en el mapa comunitario con su zona de búsqueda.",
  },
  {
    num: "03",
    icono: "👁️",
    titulo: "Avistamientos",
    desc: "Cualquier persona reporta dónde la vio, con ubicación y foto opcional. El dueño recibe aviso y puede verificar el reporte.",
  },
  {
    num: "04",
    icono: "🎉",
    titulo: "Reunión",
    desc: "Coordina por mensajes en la ficha y marca el caso como reunido cuando vuelva a casa.",
  },
] as const;

type Props = { sinEncabezado?: boolean };

export function SeccionPasosReunion({ sinEncabezado = false }: Props) {
  return (
    <div className="steps-section">
      <div className="steps-inner">
        {!sinEncabezado && (
          <div className="section-header section-header--izq">
            <div
              className="section-eyebrow"
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              Cómo colaborar
            </div>
            <div className="section-title" style={{ color: "white" }}>
              Del reporte a la reunión
            </div>
            <p
              className="section-sub"
              style={{ color: "rgba(255,255,255,0.72)", textAlign: "left" }}
            >
              Flujo pensado para dueños y vecinos en la misma ciudad
            </p>
          </div>
        )}
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
