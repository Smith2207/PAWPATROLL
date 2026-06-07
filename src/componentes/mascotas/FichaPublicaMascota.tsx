import { BadgeEstadoMascota } from "@/componentes/mascotas/BadgeEstadoMascota";
import { CarruselFotosPublica } from "@/componentes/mascotas/CarruselFotosPublica";
import { MapaMascotaFicha } from "@/componentes/mascotas/MapaMascotaFicha";
import { PanelComportamiento } from "@/componentes/comportamiento/PanelComportamiento";
import type { obtenerMascotaPublica } from "@/actions/mascotas";
import type { DatosMapaMascota } from "@/actions/mapa";
import Link from "next/link";
import { BotonReportarAvistamiento } from "@/componentes/mascotas/BotonReportarAvistamiento";
import { TimelineAvistamientos } from "@/componentes/mascotas/TimelineAvistamientos";
import type { AvistamientoConMensajes } from "@/actions/avistamientos";
import { Icono, type NombreIcono } from "@/componentes/ui/Icono";

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
  const { mascota, duenoNombre, fotos } = datos;

  const mostrarTimeline =
    mascota.estado === "PERDIDA" &&
    (avistamientos.length > 0 || mascota.fechaPerdida);

  const metas = [
    mascota.tipo,
    mascota.raza,
    mascota.sexo,
    mascota.edad,
  ].filter(Boolean) as string[];

  const datosInformacion = [
    mascota.color && { label: "Color", valor: mascota.color, icono: "color" as const },
    mascota.tamano && { label: "Tamaño", valor: mascota.tamano, icono: "tamano" as const },
    mascota.peso && { label: "Peso", valor: mascota.peso, icono: "peso" as const },
    mascota.collar && {
      label: "Collar / placa",
      valor: mascota.collar,
      icono: "etiqueta" as const,
    },
    mascota.microchip && {
      label: "Microchip",
      valor: mascota.microchip,
      icono: "vacuna" as const,
    },
    mascota.fechaPerdida && {
      label: "Desde",
      valor: new Date(mascota.fechaPerdida).toLocaleString("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      icono: "reloj" as const,
    },
    mascota.lugarPerdida && {
      label: "Último lugar visto",
      valor: mascota.lugarPerdida,
      icono: "ubicacion" as const,
      ancho: true,
    },
    mascota.contactoPublico && {
      label: "Contacto",
      valor: mascota.contactoPublico,
      icono: "telefono" as const,
      ancho: true,
      enlace: mascota.contactoPublico.includes("@")
        ? `mailto:${mascota.contactoPublico}`
        : `tel:${mascota.contactoPublico.replace(/\s/g, "")}`,
    },
  ].filter(Boolean) as {
    label: string;
    valor: string;
    icono: NombreIcono;
    ancho?: boolean;
    enlace?: string;
  }[];

  const detallesTexto = [
    mascota.descripcion,
    mascota.senasParticulares &&
      `Señas particulares: ${mascota.senasParticulares}`,
    mascota.enfermedades && `Salud: ${mascota.enfermedades}`,
  ].filter(Boolean) as string[];

  return (
    <div className="ficha-publica">
      <Link href="/" className="ficha-publica-volver">
        <Icono nombre="izquierda" size={16} className="pp-icon--btn" />
        Volver a PawPatrol
      </Link>

      <div
        className={`ficha-publica-contenedor ${
          mostrarTimeline ? "ficha-publica-contenedor--con-lateral" : ""
        }`}
      >
        <div className="ficha-publica-principal">
        <article
          className={`ficha-publica-hero ${
            mascota.estado === "PERDIDA"
              ? "ficha-publica-hero--perdida"
              : mascota.estado === "ENCONTRADA"
                ? "ficha-publica-hero--encontrada"
                : ""
          }`}
        >
        <div className="ficha-publica-columna-izq">
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
                <Icono nombre="alerta" size={20} />
              </span>
              <p>
                Esta mascota está <strong>perdida</strong>. Si la ves, usa el
                botón de abajo para reportar un avistamiento vinculado a{" "}
                <strong>{mascota.nombre}</strong>.
              </p>
            </div>
          )}

          {datosInformacion.length > 0 && (
            <section className="ficha-publica-seccion">
              <h2 className="ficha-publica-seccion-titulo">Información</h2>
              <div className="ficha-publica-datos">
                {datosInformacion.map((d) => (
                  <div
                    key={d.label}
                    className={`ficha-publica-dato ${d.ancho ? "ficha-publica-dato--ancho" : ""}`}
                  >
                    <span className="ficha-publica-dato-icono" aria-hidden>
                      <Icono nombre={d.icono} size={18} />
                    </span>
                    <div className="ficha-publica-dato-texto">
                      <label>{d.label}</label>
                      {d.enlace ? (
                        <a className="ficha-publica-dato-enlace" href={d.enlace}>
                          {d.valor}
                        </a>
                      ) : (
                        <span>{d.valor}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {detallesTexto.length > 0 && (
            <section className="ficha-publica-seccion">
              <h2 className="ficha-publica-seccion-titulo">Detalles</h2>
              <div className="ficha-publica-detalles-cajas">
                {detallesTexto.map((texto) => (
                  <p key={texto} className="ficha-publica-detalle-caja">
                    {texto}
                  </p>
                ))}
              </div>
            </section>
          )}

          <footer className="ficha-publica-pie">
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
                <Icono nombre="mapa" size={18} className="pp-icon--btn" />
                Ver mapa de avistamientos
              </Link>
            )}
          </footer>
        </div>
        </article>

        {esDueno && datosMapa?.prediccion && (
          <div className="ficha-publica-comportamiento">
            <PanelComportamiento
              prediccion={datosMapa.prediccion}
              nombreMascota={mascota.nombre}
              mascotaId={mascota.id}
            />
          </div>
        )}
        </div>

        {mostrarTimeline && (
          <aside className="ficha-publica-lateral">
            <TimelineAvistamientos
              avistamientos={avistamientos}
              fechaAlerta={mascota.fechaPerdida?.toISOString()}
              nombreMascota={mascota.nombre}
              lateral
            />
            {esDueno && (
              <p className="ficha-publica-caso-dueno">
                <Link href={`/mis-mascotas/${mascota.id}/caso`}>
                  Mensajes y avistamientos
                  <Icono nombre="derecha" size={14} className="pp-icon--btn" />
                </Link>
              </p>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
