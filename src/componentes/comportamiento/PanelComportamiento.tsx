import type { PrediccionComportamiento } from "@/lib/comportamiento/prediccion";
import { Icono } from "@/componentes/ui/Icono";

type Props = {
  prediccion: PrediccionComportamiento;
  nombreMascota: string;
  mascotaId?: string;
};

function etiquetaTendencia(tendencia: PrediccionComportamiento["cerco"]["tendencia"]) {
  if (tendencia === "ampliado") return "ampliado";
  if (tendencia === "contraido") return "focalizado";
  return "ajustado";
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
      <h2 id="comportamiento-titulo" className="ficha-publica-seccion-titulo">
        <Icono nombre="cerebro" size={20} className="pp-icon--btn" /> Búsqueda inteligente de{" "}
        {nombre}
      </h2>
      <p className="panel-comportamiento-plan">
        Plan exclusivo de <strong>{nombre}</strong>
        <span className="panel-comportamiento-perfil-meta"> · {tiempo} desde la pérdida</span>
      </p>

      {prediccion.rasgos.length > 0 && (
        <ul className="panel-comportamiento-rasgos" aria-label="Características de la mascota">
          {prediccion.rasgos.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}

      <p className="panel-comportamiento-perfil">{prediccion.perfilConductual.etiqueta}</p>

      <div className="panel-comportamiento-metricas">
        <div className="panel-comportamiento-metrica">
          <span className="panel-comportamiento-metrica-valor">
            {(prediccion.radioActualMetros / 1000).toFixed(1)} km
          </span>
          <span className="panel-comportamiento-metrica-etiq">
            Cerco de {nombre} ({etiquetaTendencia(prediccion.cerco.tendencia)})
          </span>
        </div>
        <div className="panel-comportamiento-metrica">
          <span className="panel-comportamiento-metrica-valor">
            {prediccion.cerco.totalAvistamientos}
          </span>
          <span className="panel-comportamiento-metrica-etiq">Sus avistamientos</span>
        </div>
        <div className="panel-comportamiento-metrica">
          <span className="panel-comportamiento-metrica-valor">
            {prediccion.zonasRefugio.length}
          </span>
          <span className="panel-comportamiento-metrica-etiq">Refugios probables</span>
        </div>
      </div>

      {prediccion.consejos.length > 0 && (
        <>
          <h3 className="panel-comportamiento-subtitulo">Qué hacer con {nombre}</h3>
          <ul className="panel-comportamiento-consejos">
            {prediccion.consejos.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </>
      )}

      <details className="panel-comportamiento-fuentes">
        <summary>Estudios usados para {nombre}</summary>
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
        Cálculo exclusivo de <strong>{nombre}</strong> según su ficha, avistamientos y
        mapa. 
      </p>
    </section>
  );
}
