"use client";

import { useModales } from "@/contexto/ContextoModales";

export function SeccionHero() {
  const { abrirModal } = useModales();

  return (
    <div className="hero-wrap" id="inicio">
      <div className="hero-dots" />
      <div className="hero">
        <div>
          <div className="hero-badge">
            <span className="dot" />
            IA · Reconocimiento Visual · Geolocalización en tiempo real
          </div>
          <h1>
            Encuentra a tu <span className="highlight">mejor amigo</span> con
            tecnología 🐾
          </h1>
          <p className="hero-desc">
            PawPatrol usa inteligencia artificial y mapas interactivos para
            reunir mascotas perdidas con sus familias. Sube una foto, activa la
            alerta y deja que la comunidad te ayude.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => abrirModal("report")}
            >
              🚨 Reportar mascota perdida
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => abrirModal("sighting")}
            >
              👁️ Vi una mascota perdida
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => abrirModal("quickcam")}
              style={{ borderColor: "rgba(16,185,129,0.5)", gap: 7 }}
            >
              📸 Tomar foto
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-num">
                <span>2,847</span>
              </div>
              <div className="stat-label">Mascotas encontradas</div>
            </div>
            <div className="stat">
              <div className="stat-num">
                <span>94</span>%
              </div>
              <div className="stat-label">Tasa de reencuentro</div>
            </div>
            <div className="stat">
              <div className="stat-num">
                <span>12.5K</span>
              </div>
              <div className="stat-label">Usuarios activos</div>
            </div>
            <div className="stat">
              <div className="stat-num">
                <span>7</span>
              </div>
              <div className="stat-label">Módulos de IA</div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-card fc-top">
            <div className="fc-icon fc-blue">🤖</div>
            <div>
              <div className="fc-text-main">IA detectó coincidencia</div>
              <div className="fc-text-sub">92% similitud — Max, Golden Retriever</div>
            </div>
          </div>
          <div className="map-card">
            <div className="map-topbar">
              <span>🗺️</span>
              <span className="map-topbar-title">Mapa en vivo — Puno</span>
              <div className="live-badge">
                <span className="live-dot" /> EN VIVO
              </div>
            </div>
            <div className="map-bg">
              <div className="map-grid" />
              <div
                className="map-road-h"
                style={{ top: "34%", left: "5%", width: "90%" }}
              />
              <div
                className="map-road-h"
                style={{ top: "64%", left: "8%", width: "78%" }}
              />
              <div
                className="map-road-v"
                style={{ left: "28%", top: "8%", height: "84%" }}
              />
              <div
                className="map-road-v"
                style={{ left: "64%", top: "5%", height: "72%" }}
              />
              <div
                className="radius-circle"
                style={{
                  width: 110,
                  height: 110,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
              <div className="pin pin-lost" style={{ top: "36%", left: "44%" }}>
                <div className="pin-dot">
                  <span>🐕</span>
                </div>
                <div className="pin-label">Max — Perdido</div>
              </div>
              <div className="pin pin-found" style={{ top: "54%", left: "60%" }}>
                <div className="pin-dot">
                  <span>👁️</span>
                </div>
                <div className="pin-label">Avistado hace 12min</div>
              </div>
              <div className="pin pin-alert" style={{ top: "26%", left: "26%" }}>
                <div className="pin-dot">
                  <span>🔔</span>
                </div>
                <div className="pin-label">Alerta activa</div>
              </div>
            </div>
            <div className="map-legend-row">
              <div className="map-legend">
                <div className="legend-item">
                  <div
                    className="legend-dot"
                    style={{ background: "var(--orange)" }}
                  />
                  Perdido
                </div>
                <div className="legend-item">
                  <div
                    className="legend-dot"
                    style={{ background: "var(--mint)" }}
                  />
                  Avistado
                </div>
                <div className="legend-item">
                  <div
                    className="legend-dot"
                    style={{ background: "var(--yellow)" }}
                  />
                  Alerta
                </div>
              </div>
              <span
                style={{
                  fontSize: "0.73rem",
                  color: "var(--muted2)",
                  fontWeight: 700,
                }}
              >
                3 activos
              </span>
            </div>
            <div className="alert-banner">
              <span style={{ fontSize: "1.1rem" }}>🔔</span>
              <span className="alert-text">
                ¡Luna avistada hace 12 min cerca al Parque Pino!
              </span>
              <span className="alert-new">¡Nuevo!</span>
            </div>
          </div>
          <div className="floating-card fc-bottom">
            <div className="fc-icon fc-green">🎉</div>
            <div>
              <div className="fc-text-main">¡Reunión exitosa!</div>
              <div className="fc-text-sub">Rocky encontrado en 4 horas</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
