const PUNTOS = [
  {
    icono: "🎓",
    titulo: "Proyecto académico UNA Puno",
    desc: "Desarrollado para ayudar a reunir mascotas con sus familias en la región.",
    tono: "blue",
  },
  {
    icono: "🔒",
    titulo: "Tú controlas tu contacto",
    desc: "Solo publicas teléfono o correo si quieres que aparezcan en la ficha.",
    tono: "navy",
  },
  {
    icono: "🤝",
    titulo: "IA como asistente, no juez",
    desc: "Las coincidencias por foto orientan; verificar un avistamiento siempre es humano.",
    tono: "purple",
  },
] as const;

export function SeccionConfianza() {
  return (
    <section className="section-wrap pp-home-confianza" aria-labelledby="home-confianza-titulo">
      <div className="section-header">
        <div className="section-eyebrow">Confianza</div>
        <h2 id="home-confianza-titulo" className="section-title">
          Hecho para vecinos, no para impresionar con tecnología
        </h2>
      </div>
      <div className="pp-home-confianza-grid">
        {PUNTOS.map((p) => (
          <article
            key={p.titulo}
            className={`pp-home-confianza-card pp-home-confianza-card--${p.tono}`}
          >
            <span className="pp-home-confianza-icono-wrap" aria-hidden>
              <span className="pp-home-confianza-icono">{p.icono}</span>
            </span>
            <h3>{p.titulo}</h3>
            <p>{p.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
