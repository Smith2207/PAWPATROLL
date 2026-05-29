import { BadgeEstadoMascota } from "@/componentes/mascotas/BadgeEstadoMascota";
import { CarruselFotosPublica } from "@/componentes/mascotas/CarruselFotosPublica";
import { MapaMascotaFicha } from "@/componentes/mascotas/MapaMascotaFicha";
import type { obtenerMascotaPublica } from "@/actions/mascotas";
import type { DatosMapaMascota } from "@/actions/mapa";
import Link from "next/link";
import { BotonReportarAvistamiento } from "@/componentes/mascotas/BotonReportarAvistamiento";
import { SeccionAvistamientosMascota } from "@/componentes/avistamientos/SeccionAvistamientosMascota";
import type { AvistamientoConMensajes } from "@/actions/avistamientos";

type DatosPublicos = NonNullable<Awaited<ReturnType<typeof obtenerMascotaPublica>>>;

function ChipMeta({ children }: { children: string }) {
  return <span className="ficha-publica-chip">{children}</span>;
}

export function FichaPublicaMascota({
  datos,
  datosMapa = null,
  avistamientos = [],
  esDueno = false,
}: {
  datos: DatosPublicos;
  datosMapa?: DatosMapaMascota | null;
  avistamientos?: AvistamientoConMensajes[];
  esDueno?: boolean;
}) {
  const { mascota, duenoNombre, fotos, historial } = datos;

  const metas = [
    mascota.tipo,
    mascota.raza,
    mascota.sexo,
    mascota.edad,
  ].filter(Boolean) as string[];

  const datosFicha = [
    mascota.color && { label: "Color", valor: mascota.color, icono: "🎨" },
    mascota.tamano && { label: "Tamaño", valor: mascota.tamano, icono: "📏" },
    mascota.peso && { label: "Peso", valor: mascota.peso, icono: "⚖️" },
    mascota.collar && {
      label: "Collar / placa",
      valor: mascota.collar,
      icono: "🏷️",
    },
    mascota.microchip && {
      label: "Microchip",
      valor: mascota.microchip,
      icono: "💉",
    },
    mascota.fechaPerdida && {
      label: "Desde",
      valor: new Date(mascota.fechaPerdida).toLocaleString("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      icono: "🕐",
    },
    mascota.lugarPerdida && {
      label: "Último lugar visto",
      valor: mascota.lugarPerdida,
      icono: "📍",
      ancho: true,
    },
    mascota.contactoPublico && {
      label: "Contacto",
      valor: mascota.contactoPublico,
      icono: "📞",
      ancho: true,
    },
  ].filter(Boolean) as {
    label: string;
    valor: string;
    icono: string;
    ancho?: boolean;
  }[];

  return (
    <div className="ficha-publica">
      <Link href="/" className="ficha-publica-volver">
        ← Volver a PawPatrol
      </Link>

      <div
        className={`ficha-publica-contenedor ${
          historial.length > 0 ? "ficha-publica-contenedor--con-historial" : ""
        }`}
      >
        <article
          className={`ficha-publica-hero ${
            mascota.estado === "PERDIDA"
              ? "ficha-publica-hero--perdida"
              : mascota.estado === "ENCONTRADA"
                ? "ficha-publica-hero--encontrada"
                : ""
          }`}
        >
          <div className="ficha-publica-media">
            <CarruselFotosPublica fotos={fotos} nombre={mascota.nombre} />
            {mascota.estado === "PERDIDA" && datosMapa && (
              <MapaMascotaFicha
                nombre={mascota.nombre}
                mascotaId={mascota.id}
                tipo={mascota.tipo}
                color={mascota.color}
                raza={mascota.raza}
                datos={datosMapa}
              />
            )}
          </div>

          <div className="ficha-publica-cuerpo">
          <header className="ficha-publica-encabezado">
            <BadgeEstadoMascota estado={mascota.estado} />
            <h1 className="ficha-publica-titulo">{mascota.nombre}</h1>
            {metas.length > 0 && (
              <div className="ficha-publica-meta-chips">
                {metas.map((m) => (
                  <ChipMeta key={m}>{m}</ChipMeta>
                ))}
              </div>
            )}
          </header>

          {mascota.estado === "PERDIDA" && (
            <div className="ficha-publica-alerta-perdida" role="status">
              <span className="ficha-publica-alerta-icono" aria-hidden>
                🚨
              </span>
              <p>
                Esta mascota está <strong>perdida</strong>. Si la ves, usa el botón
                de abajo para reportar un avistamiento vinculado a{" "}
                <strong>{mascota.nombre}</strong>.
              </p>
            </div>
          )}

          {datosFicha.length > 0 && (
            <section className="ficha-publica-seccion">
              <h2 className="ficha-publica-seccion-titulo">Información</h2>
              <div className="ficha-publica-datos">
                {datosFicha.map((d) => (
                  <div
                    key={d.label}
                    className={`ficha-publica-dato ${d.ancho ? "ficha-publica-dato--ancho" : ""}`}
                  >
                    <span className="ficha-publica-dato-icono" aria-hidden>
                      {d.icono}
                    </span>
                    <div className="ficha-publica-dato-texto">
                      <label>{d.label}</label>
                      <span>{d.valor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(mascota.descripcion || mascota.enfermedades || mascota.senasParticulares) && (
            <section className="ficha-publica-seccion">
              <h2 className="ficha-publica-seccion-titulo">Detalles</h2>
              {mascota.descripcion && (
                <p className="ficha-publica-bloque-texto">{mascota.descripcion}</p>
              )}
              {mascota.enfermedades && (
                <p className="ficha-publica-bloque-texto">
                  <span className="ficha-publica-bloque-etiqueta">Salud / enfermedades</span>
                  {mascota.enfermedades}
                </p>
              )}
              {mascota.senasParticulares && (
                <p className="ficha-publica-bloque-texto">
                  <span className="ficha-publica-bloque-etiqueta">Señas particulares</span>
                  {mascota.senasParticulares}
                </p>
              )}
            </section>
          )}

          <div className="ficha-publica-pie">
            {duenoNombre && (
              <p className="ficha-publica-dueno">
                <span className="ficha-publica-dueno-etiqueta">Publicado por</span>
                <strong>{duenoNombre}</strong>
              </p>
            )}
            {mascota.estado === "PERDIDA" ? (
              <BotonReportarAvistamiento
                mascotaId={mascota.id}
                nombre={mascota.nombre}
                tipo={mascota.tipo}
                color={mascota.color}
                raza={mascota.raza}
              />
            ) : (
              <Link href="/comunidad" className="ficha-publica-cta">
                🗺️ Ver mapa de avistamientos
              </Link>
            )}
          </div>
          </div>
        </article>

        {historial.length > 0 && (
          <aside className="tarjeta-panel ficha-publica-historial">
            <h2 className="ficha-publica-seccion-titulo">Historial</h2>
            <ul className="historial-lista ficha-publica-historial-lista">
              {historial.map((h, i) => (
                <li key={i} className="historial-item ficha-publica-historial-item">
                  <BadgeEstadoMascota estado={h.estadoNuevo} />
                  {h.notas && (
                    <p className="historial-item-notas">{h.notas}</p>
                  )}
                  <time className="historial-item-fecha">
                    {new Date(h.createdAt).toLocaleString("es-PE", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      {mascota.estado === "PERDIDA" && (
        <SeccionAvistamientosMascota
          mascotaId={mascota.id}
          nombreMascota={mascota.nombre}
          avistamientosIniciales={avistamientos}
          esDueno={esDueno}
          prediccion={datosMapa?.prediccion ?? null}
        />
      )}
    </div>
  );
}
