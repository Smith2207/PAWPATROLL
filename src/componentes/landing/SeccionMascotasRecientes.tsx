"use client";

import { useModales } from "@/contexto/ContextoModales";

const MASCOTAS = [
  {
    emoji: "🐕",
    fondo: "linear-gradient(135deg,#FFF5EC,#FFEAD5)",
    estado: "status-lost",
    estadoTexto: "🔴 Perdido",
    tiempo: "hace 3h",
    nombre: "Max",
    raza: "Golden Retriever · Macho · 3 años",
    ubicacion: "📍 Jr. Moquegua, Puno",
    match: 85,
    matchColor: "linear-gradient(90deg,var(--orange),var(--orange2))",
  },
  {
    emoji: "🐱",
    fondo: "linear-gradient(135deg,#F0FAF9,#D1FAE5)",
    estado: "status-lost",
    estadoTexto: "🔴 Perdida",
    tiempo: "hace 1d",
    nombre: "Luna",
    raza: "Siamés · Hembra · 2 años",
    ubicacion: "📍 Av. El Sol, Puno",
    match: 62,
    matchColor: "linear-gradient(90deg,var(--blue),var(--blue2))",
  },
  {
    emoji: "🐶",
    fondo: "linear-gradient(135deg,#ECFDF5,#D1FAE5)",
    estado: "status-found",
    estadoTexto: "🟢 Avistado",
    tiempo: "hace 12min",
    nombre: "Rocky",
    raza: "Labrador negro · Macho · 5 años",
    ubicacion: "📍 Parque Pino, Puno",
    match: 92,
    matchColor: "linear-gradient(90deg,var(--mint),#34D399)",
  },
  {
    emoji: "🐕",
    fondo: "linear-gradient(135deg,#FFFBEB,#FEF3C7)",
    estado: "status-lost",
    estadoTexto: "🔴 Perdida",
    tiempo: "hace 2d",
    nombre: "Coco",
    raza: "Chihuahua · Hembra · 1 año",
    ubicacion: "📍 Uros Chulluni, Puno",
    match: 45,
    matchColor: "linear-gradient(90deg,var(--yellow),#FCD34D)",
  },
] as const;

export function SeccionMascotasRecientes() {
  const { abrirModal } = useModales();

  return (
    <div className="section-wrap" id="avistamientos" style={{ paddingTop: 0 }}>
      <div className="section-header section-header--izq" style={{ marginBottom: "1.8rem" }}>
        <div className="section-eyebrow">En tiempo real</div>
        <div className="section-title">Avistamientos y mascotas perdidas 🐶🐱</div>
        <p className="section-sub">
          Reportes recientes de la comunidad: perdidos, avistados y coincidencias por IA
        </p>
      </div>
      <div className="pets-header">
        <h2>Últimos casos activos</h2>
        <button
          type="button"
          className="see-all"
          style={{ background: "none", border: "none", font: "inherit" }}
          onClick={() => abrirModal("sighting")}
        >
          👁️ Reportar avistamiento →
        </button>
      </div>
      <div className="pets-grid">
        {MASCOTAS.map((m) => (
          <div key={m.nombre} className="pet-card">
            <div className="pet-photo" style={{ background: m.fondo }}>
              {m.emoji}
              <div className={`status-pill ${m.estado}`}>{m.estadoTexto}</div>
              <div className="time-pill">{m.tiempo}</div>
            </div>
            <div className="pet-info">
              <div className="pet-name">{m.nombre}</div>
              <div className="pet-breed">{m.raza}</div>
              <div className="pet-location">{m.ubicacion}</div>
              <div className="match-bar-bg">
                <div
                  className="match-bar"
                  style={{ width: `${m.match}%`, background: m.matchColor }}
                />
              </div>
              <div className="match-label">{m.match}% coincidencias por IA</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
