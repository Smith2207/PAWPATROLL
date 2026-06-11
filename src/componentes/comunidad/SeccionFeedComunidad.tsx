import Link from "next/link";
import type {
  ActividadComunidad,
  ColaboradorDestacado,
} from "@/actions/comunidad";

type Props = {
  actividad: ActividadComunidad[];
  colaboradores: ColaboradorDestacado[];
  /** Columna junto al mapa en /comunidad */
  lateral?: boolean;
};

function badgeTexto(badge: ColaboradorDestacado["badge"]) {
  if (badge === "ayudante") return "Vecino ayudante";
  if (badge === "vecino") return "Colaborador";
  return null;
}

function tiempoRelativo(fecha: Date) {
  const diff = Date.now() - fecha.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

function ListaActividad({ actividad }: { actividad: ActividadComunidad[] }) {
  if (actividad.length === 0) {
    return (
      <p className="pp-feed-vacio">
        Aún no hay avistamientos publicados. Sé el primero en reportar uno.
      </p>
    );
  }

  return (
    <ul className="pp-feed-lista">
      {actividad.map((a) => (
        <li key={a.id} className={`pp-feed-item pp-feed-item--${a.tipo}`}>
          <div className="pp-feed-item-cuerpo">
            <strong>{a.titulo}</strong>
            <span>{a.subtitulo}</span>
            <time dateTime={a.fecha.toISOString()}>{tiempoRelativo(a.fecha)}</time>
          </div>
          {a.slug && (
            <Link href={`/mascota/${a.slug}`} className="pp-feed-link">
              Ver mascota
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

function PanelColaboradores({ colaboradores }: { colaboradores: ColaboradorDestacado[] }) {
  if (colaboradores.length === 0) return null;

  return (
    <aside className="pp-colaboradores-panel">
      <h3 className="pp-colaboradores-titulo">Top colaboradores</h3>
      <ul className="pp-colaboradores-lista">
        {colaboradores.map((c, i) => (
          <li key={c.userId} className="pp-colaborador-item">
            <span className="pp-colaborador-rank">{i + 1}</span>
            <div className="pp-colaborador-cuerpo">
              <p className="pp-colaborador-meta">
                <strong>{c.nombre}</strong>
                <span className="pp-colaborador-conteo">
                  {c.avistamientosVerificados} avistamiento
                  {c.avistamientosVerificados === 1 ? "" : "s"}
                </span>
              </p>
              {c.badge && (
                <span className={`pp-badge-colaborador pp-badge-colaborador--${c.badge}`}>
                  {badgeTexto(c.badge)}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function SeccionFeedComunidad({
  actividad,
  colaboradores,
  lateral = false,
}: Props) {
  if (lateral) {
    return (
      <aside className="pp-feed-comunidad pp-feed-comunidad--lateral" aria-label="Actividad de la comunidad">
        <p className="section-eyebrow pp-feed-eyebrow">Actividad reciente</p>
        <ListaActividad actividad={actividad} />
        <PanelColaboradores colaboradores={colaboradores} />
      </aside>
    );
  }

  return (
    <section className="section-wrap pp-feed-comunidad" aria-labelledby="feed-comunidad-titulo">
      <div className="pp-feed-comunidad-grid">
        <div>
          <div className="section-header section-header--izq">
            <div className="section-eyebrow">Actividad reciente</div>
            <h2 id="feed-comunidad-titulo" className="section-title">
              Lo que hace la comunidad
            </h2>
          </div>
          <ListaActividad actividad={actividad} />
        </div>
        <PanelColaboradores colaboradores={colaboradores} />
      </div>
    </section>
  );
}
