import type { EventoCaso } from "@/lib/db/schema";

const ICONOS: Record<string, string> = {
  ALERTA_ACTIVADA: "🚨",
  AVISTAMIENTO_NUEVO: "👁️",
  FOTO_AGREGADA: "📷",
  MENSAJE_ENVIADO: "💬",
  AVISTAMIENTO_VERIFICADO: "✓",
  AVISTAMIENTO_DESCARTADO: "✗",
  COINCIDENCIA_IA: "🤖",
  ESTADO_CAMBIADO: "🔄",
  MASCOTA_RECUPERADA: "🎉",
};

type Props = {
  eventos: EventoCaso[];
};

export function TimelineCaso({ eventos }: Props) {
  if (eventos.length === 0) {
    return (
      <p className="pp-caso-timeline-vacio">
        Aún no hay actividad registrada en este caso.
      </p>
    );
  }

  return (
    <ol className="pp-caso-timeline">
      {eventos.map((e) => (
        <li key={e.id} className="pp-caso-timeline-item">
          <span className="pp-caso-timeline-icono" aria-hidden>
            {ICONOS[e.tipo] ?? "•"}
          </span>
          <div className="pp-caso-timeline-cuerpo">
            <time dateTime={e.createdAt.toISOString()}>
              {new Date(e.createdAt).toLocaleString("es-PE", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </time>
            <strong>{e.titulo}</strong>
            {e.detalle && <p>{e.detalle}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
