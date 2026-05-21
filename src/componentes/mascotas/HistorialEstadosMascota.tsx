import { BadgeEstadoMascota } from "@/componentes/mascotas/BadgeEstadoMascota";
import type { HistorialEstadoMascota } from "@/lib/db/schema";

type Props = {
  historial: HistorialEstadoMascota[];
};

export function HistorialEstadosMascota({ historial }: Props) {
  if (historial.length === 0) {
    return (
      <p style={{ color: "var(--muted)", fontWeight: 600, fontSize: "0.85rem" }}>
        Aún no hay cambios de estado registrados.
      </p>
    );
  }

  return (
    <ul className="historial-lista">
      {historial.map((h) => (
        <li key={h.id} className="historial-item">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <BadgeEstadoMascota estado={h.estadoAnterior} />
            <span style={{ fontWeight: 800, color: "var(--muted)" }}>→</span>
            <BadgeEstadoMascota estado={h.estadoNuevo} />
          </div>
          {h.notas && (
            <p style={{ fontSize: "0.82rem", margin: "4px 0 0", fontWeight: 600 }}>
              {h.notas}
            </p>
          )}
          <div className="historial-item-fecha">
            {new Date(h.createdAt).toLocaleString("es-PE", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </div>
        </li>
      ))}
    </ul>
  );
}
