/**
 * [comportamiento] Panel: comportamiento.
 */
import type { PrediccionComportamiento } from "@/lib/comportamiento/prediccion";
import { Icono } from "@/componentes/ui/Icono";

type Props = {
  prediccion: PrediccionComportamiento;
  nombreMascota: string;
  mascotaId?: string;
};

function etiquetaTendencia(tendencia: PrediccionComportamiento["cerco"]["tendencia"]) {
  if (tendencia === "ampliado") return "Área ampliada";
  if (tendencia === "contraido") return "Área focalizada";
  return "Área ajustada";
}

export function PanelComportamiento({ prediccion, nombreMascota, mascotaId }: Props) {
  if (mascotaId && prediccion.mascotaId !== mascotaId) {
    return null;
  }

  const nombre = prediccion.nombreMascota || nombreMascota;
  const tiempo =
    prediccion.horasTranscurridas < 24
      ? `${Math.round(prediccion.horasTranscurridas)} h`
      : `${prediccion.diasTranscurridos} d`;

  return (
    <section className="panel-comportamiento" aria-labelledby="comportamiento-titulo">
      <header className="panel-comportamiento-cabecera">
        <div className="panel-comportamiento-cabecera-icono" aria-hidden>
          <Icono nombre="cerebro" size={26} />
        </div>
        <div className="panel-comportamiento-cabecera-texto">
          <span className="panel-comportamiento-eyebrow">Plan de búsqueda</span>
          <h2 id="comportamiento-titulo" className="panel-comportamiento-titulo">
            Búsqueda inteligente de {nombre}
          </h2>
          <p className="panel-comportamiento-lead">
            Exclusivo para <strong>{nombre}</strong>
            <span className="panel-comportamiento-lead-meta">
              {" "}
              · {tiempo} desde la pérdida
            </span>
          </p>
        </div>
      </header>

      {prediccion.rasgos.length > 0 && (
        <ul className="panel-comportamiento-rasgos" aria-label="Características de la mascota">
          {prediccion.rasgos.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}

      <p className="panel-comportamiento-perfil">
        <Icono nombre="objetivo" size={16} className="pp-icon--btn" />
        {prediccion.perfilConductual.etiqueta}
      </p>

      <div className="panel-comportamiento-metricas">
        <article className="panel-comportamiento-metrica panel-comportamiento-metrica--cerco">
          <span className="panel-comportamiento-metrica-icono" aria-hidden>
            <Icono nombre="mapa" size={20} />
          </span>
          <span className="panel-comportamiento-metrica-valor">
            {(prediccion.radioActualMetros / 1000).toFixed(1)} km
          </span>
          <span className="panel-comportamiento-metrica-etiq">
            Cerco de búsqueda
          </span>
          <span className="panel-comportamiento-metrica-detalle">
            {etiquetaTendencia(prediccion.cerco.tendencia)}
          </span>
        </article>

        <article className="panel-comportamiento-metrica panel-comportamiento-metrica--avist">
          <span className="panel-comportamiento-metrica-icono" aria-hidden>
            <Icono nombre="ojo" size={20} />
          </span>
          <span className="panel-comportamiento-metrica-valor">
            {prediccion.cerco.totalAvistamientos}
          </span>
          <span className="panel-comportamiento-metrica-etiq">Avistamientos</span>
          <span className="panel-comportamiento-metrica-detalle">Reportados en el mapa</span>
        </article>

        <article className="panel-comportamiento-metrica panel-comportamiento-metrica--refugio">
          <span className="panel-comportamiento-metrica-icono" aria-hidden>
            <Icono nombre="casa" size={20} />
          </span>
          <span className="panel-comportamiento-metrica-valor">
            {prediccion.zonasRefugio.length}
          </span>
          <span className="panel-comportamiento-metrica-etiq">Refugios probables</span>
          <span className="panel-comportamiento-metrica-detalle">En el mapa de arriba</span>
        </article>
      </div>

      {prediccion.consejos.length > 0 && (
        <div className="panel-comportamiento-consejos-bloque">
          <h3 className="panel-comportamiento-consejos-titulo">
            <Icono nombre="checkCirculo" size={18} className="pp-icon--btn" />
            Qué hacer con {nombre}
          </h3>
          <ul className="panel-comportamiento-consejos">
            {prediccion.consejos.map((c, i) => (
              <li key={i}>
                <span className="panel-comportamiento-consejo-num" aria-hidden>
                  {i + 1}
                </span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="panel-comportamiento-fuentes">
        <summary>
          <Icono nombre="graduacion" size={16} className="pp-icon--btn" />
          Fuentes científicas
        </summary>
        <ul className="panel-comportamiento-fuentes-lista">
          {prediccion.fuentes.map((f) => (
            <li key={f.id}>
              <a href={f.url} target="_blank" rel="noopener noreferrer">
                {f.autores ? `${f.autores} — ` : ""}
                {f.titulo}
                {f.anio ? ` (${f.anio})` : ""}
              </a>
            </li>
          ))}
        </ul>
      </details>

      <p className="panel-comportamiento-nota">
        <Icono nombre="info" size={14} className="pp-icon--btn" />
        Cálculo basado en su ficha, avistamientos y mapa.
        Orientativo; no sustituye tu criterio en la búsqueda.
      </p>
    </section>
  );
}
