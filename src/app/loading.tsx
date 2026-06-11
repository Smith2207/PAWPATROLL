/**
 * Landing pública (inicio). Estado de carga (skeleton) de la ruta.
 */
export default function Cargando() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        fontFamily: "var(--font-nunito), Nunito, sans-serif",
        background: "var(--bg, #f8fafc)",
        color: "var(--navy, #0f172a)",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "4px solid #e2e8f0",
          borderTopColor: "#2563eb",
          animation: "pawpatrol-spin 0.8s linear infinite",
        }}
      />
      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>
        Cargando PawPatrol…
      </p>
      <style>{`@keyframes pawpatrol-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
