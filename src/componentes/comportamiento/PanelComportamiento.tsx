import type { PrediccionComportamiento } from "@/lib/comportamiento/prediccion";
import { Icono } from "@/componentes/ui/Icono";

type Props = {
  prediccion: PrediccionComportamiento;
  nombreMascota: string;
};

export function PanelComportamiento({ prediccion, nombreMascota }: Props) {
  return (
    <section className="panel-comportamiento" aria-labelledby="comportamiento-titulo">
      <h2 id="comportamiento-titulo" className="ficha-publica-seccion-titulo">
        <Icono nombre="cerebro" size={20} className="pp-icon--btn" /> Búsqueda inteligente
      </h2>
      <p className="panel-comportamiento-perfil">{prediccion.perfilConductual.etiqueta}</p>
      <p className="panel-comportamiento-evidencia" role="note">
        {prediccion.notaEvidencia}
      </p>

      <div className="panel-comportamiento-metricas">
        <div className="panel-comportamiento-metrica">
          <span className="panel-comportamiento-metrica-valor">
            {(prediccion.radioActualMetros / 1000).toFixed(1)} km
          </span>
          <span className="panel-comportamiento-metrica-etiq">
            Cerco en mapa (
            {prediccion.cerco.tendencia === "ampliado"
              ? "ampliado"
              : prediccion.cerco.tendencia === "contraido"
                ? "focalizado"
                : "ajustado"}
            )
          </span>
        </div>
        <div className="panel-comportamiento-metrica">
          <span className="panel-comportamiento-metrica-valor">
            {prediccion.horasTranscurridas < 24
              ? `${Math.round(prediccion.horasTranscurridas)} h`
              : `${prediccion.diasTranscurridos} d`}
          </span>
          <span className="panel-comportamiento-metrica-etiq">Desde la pérdida</span>
        </div>
        <div className="panel-comportamiento-metrica">
          <span className="panel-comportamiento-metrica-valor">
            {prediccion.zonasRefugio.length}
          </span>
          <span className="panel-comportamiento-metrica-etiq">Refugios probables</span>
        </div>
      </div>

      <ul className="panel-comportamiento-consejos">
        {prediccion.consejos.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>

      <p className="panel-comportamiento-avistamientos" role="status">
        {prediccion.cerco.motivoAjuste}
        {prediccion.cerco.totalAvistamientos > 0 &&
          ` · ${prediccion.cerco.totalAvistamientos} avistamiento(s) considerados.`}
      </p>

      <details className="panel-comportamiento-fuentes">
        <summary>Referencias y estudios</summary>
        <ul>
          {prediccion.fuentes.map((f) => (
            <li key={f.id}>
              <a href={f.url} target="_blank" rel="noopener noreferrer">
                {f.titulo}
                {f.anio ? ` (${f.anio})` : ""}
              </a>
              {f.autores && <span className="panel-comportamiento-fuentes-autor"> — {f.autores}</span>}
              <p>{f.nota}</p>
            </li>
          ))}
        </ul>
      </details>

      <p className="panel-comportamiento-nota">
        Análisis de <strong>{nombreMascota}</strong>: acceso al exterior, raza, tamaño,
        tiempo perdido y avistamientos. No sustituye búsqueda física ni asesoría
        profesional.
      </p>
    </section>
  );
}
