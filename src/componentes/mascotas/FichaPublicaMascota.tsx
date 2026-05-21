import { BadgeEstadoMascota } from "@/componentes/mascotas/BadgeEstadoMascota";
import type { obtenerMascotaPublica } from "@/actions/mascotas";
import Link from "next/link";

type DatosPublicos = NonNullable<Awaited<ReturnType<typeof obtenerMascotaPublica>>>;

export function FichaPublicaMascota({ datos }: { datos: DatosPublicos }) {
  const { mascota, duenoNombre, fotos, historial } = datos;
  const principal = fotos[0]?.url;
  const secundarias = fotos.slice(1, 5);

  return (
    <div className="ficha-publica">
      <p className="auth-enlace" style={{ marginBottom: "1rem" }}>
        <Link href="/">← Volver a PawPatrol</Link>
      </p>

      <article className="ficha-publica-hero">
        <div className="ficha-publica-galeria">
          <div className="ficha-publica-galeria-principal">
            {principal ? (
              <img src={principal} alt={mascota.nombre} />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  fontSize: "4rem",
                }}
              >
                🐾
              </div>
            )}
          </div>
          {secundarias.length > 0 && (
            <div className="ficha-publica-miniaturas">
              {secundarias.map((f) => (
                <img key={f.id} src={f.url} alt="" />
              ))}
            </div>
          )}
        </div>

        <div className="ficha-publica-cuerpo">
          <BadgeEstadoMascota estado={mascota.estado} />
          <h1 className="ficha-publica-titulo">{mascota.nombre}</h1>
          <p style={{ fontWeight: 700, color: "var(--muted)" }}>
            {mascota.tipo}
            {mascota.raza ? ` · ${mascota.raza}` : ""}
            {mascota.sexo ? ` · ${mascota.sexo}` : ""}
          </p>

          {mascota.estado === "PERDIDA" && (
            <p
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                background: "#fef2f2",
                borderRadius: 12,
                border: "1px solid #fecaca",
                fontWeight: 700,
              }}
            >
              🔴 Esta mascota está perdida. Si la ves, reporta un avistamiento en
              la landing.
            </p>
          )}

          <div className="ficha-publica-datos">
            {mascota.color && (
              <div className="ficha-publica-dato">
                <label>Color</label>
                <span>{mascota.color}</span>
              </div>
            )}
            {mascota.edad && (
              <div className="ficha-publica-dato">
                <label>Edad</label>
                <span>{mascota.edad}</span>
              </div>
            )}
            {mascota.tamano && (
              <div className="ficha-publica-dato">
                <label>Tamaño</label>
                <span>{mascota.tamano}</span>
              </div>
            )}
            {mascota.collar && (
              <div className="ficha-publica-dato">
                <label>Collar</label>
                <span>{mascota.collar}</span>
              </div>
            )}
            {mascota.lugarPerdida && (
              <div className="ficha-publica-dato">
                <label>Último lugar visto</label>
                <span>📍 {mascota.lugarPerdida}</span>
              </div>
            )}
            {mascota.fechaPerdida && (
              <div className="ficha-publica-dato">
                <label>Desde</label>
                <span>
                  {new Date(mascota.fechaPerdida).toLocaleString("es-PE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            )}
            {mascota.contactoPublico && (
              <div className="ficha-publica-dato">
                <label>Contacto</label>
                <span>{mascota.contactoPublico}</span>
              </div>
            )}
          </div>

          {mascota.descripcion && (
            <p style={{ lineHeight: 1.6, fontWeight: 600 }}>{mascota.descripcion}</p>
          )}
          {mascota.senasParticulares && (
            <p style={{ lineHeight: 1.6, marginTop: "0.75rem" }}>
              <strong>Señas:</strong> {mascota.senasParticulares}
            </p>
          )}

          {duenoNombre && (
            <p
              style={{
                marginTop: "1.25rem",
                fontSize: "0.85rem",
                color: "var(--muted)",
                fontWeight: 600,
              }}
            >
              Publicado por {duenoNombre}
            </p>
          )}
        </div>
      </article>

      {historial.length > 0 && (
        <div className="tarjeta-panel" style={{ marginTop: "1.5rem" }}>
          <h2>Historial de estados</h2>
          <ul className="historial-lista">
            {historial.map((h, i) => (
              <li key={i} className="historial-item">
                <BadgeEstadoMascota estado={h.estadoNuevo} />
                {h.notas && (
                  <p style={{ fontSize: "0.82rem", margin: "6px 0 0", fontWeight: 600 }}>
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
        </div>
      )}
    </div>
  );
}
