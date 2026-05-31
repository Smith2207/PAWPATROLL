import type { AvistamientoConMensajes } from "@/actions/avistamientos";

type Props = {
  avistamientos: AvistamientoConMensajes[];
  fechaAlerta?: string | null;
  nombreMascota: string;
  lateral?: boolean;
};

function formatearFecha(fecha: Date | string) {
  return new Date(fecha).toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type TipoEvento = "alerta" | "pendiente" | "verificado" | "descartado";

export function TimelineAvistamientos({
  avistamientos,
  fechaAlerta,
  nombreMascota,
  lateral = false,
}: Props) {
  const eventos: {
    id: string;
    fecha: Date;
    titulo: string;
    detalle?: string;
    icono: string;
    tipo: TipoEvento;
  }[] = [];

  if (fechaAlerta) {
    eventos.push({
      id: "alerta",
      fecha: new Date(fechaAlerta),
      titulo: "Alerta activada",
      detalle: `Se publicó la búsqueda de ${nombreMascota}`,
      icono: "🚨",
      tipo: "alerta",
    });
  }

  for (const av of avistamientos) {
    const tipo: TipoEvento =
      av.estado === "VERIFICADO"
        ? "verificado"
        : av.estado === "DESCARTADO"
          ? "descartado"
          : "pendiente";

    eventos.push({
      id: av.id,
      fecha: new Date(av.createdAt),
      titulo:
        av.estado === "VERIFICADO"
          ? `Avistamiento #${av.numeroReporte} verificado`
          : av.estado === "DESCARTADO"
            ? `Avistamiento #${av.numeroReporte} descartado`
            : `Avistamiento #${av.numeroReporte}`,
      detalle: av.direccion ?? av.referencias ?? undefined,
      icono:
        av.estado === "VERIFICADO"
          ? "✓"
          : av.estado === "DESCARTADO"
            ? "✗"
            : "👁️",
      tipo,
    });
  }

  if (eventos.length === 0) return null;

  eventos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  return (
    <section
      className={`ficha-publica-timeline ${lateral ? "ficha-publica-timeline--lateral" : ""}`}
      aria-labelledby="timeline-avistamientos-titulo"
    >
      <h2 id="timeline-avistamientos-titulo" className="ficha-publica-seccion-titulo">
        Línea de tiempo
      </h2>
      <ol className="pp-timeline">
        {eventos.map((e, i) => (
          <li
            key={e.id}
            className={`pp-timeline-item pp-timeline-item--${e.tipo}`}
          >
            <span className="pp-timeline-icono" aria-hidden>
              {e.icono}
            </span>
            <div className="pp-timeline-cuerpo">
              <time dateTime={e.fecha.toISOString()}>{formatearFecha(e.fecha)}</time>
              <strong>{e.titulo}</strong>
              {e.detalle && <p>{e.detalle}</p>}
            </div>
            {i < eventos.length - 1 && (
              <span className="pp-timeline-linea" aria-hidden />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
