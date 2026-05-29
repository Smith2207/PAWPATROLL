import { emojiPorTipo, esTipoMascotaPermitido } from "@/lib/mascotas/tipos";
import { BadgeEstadoMascota } from "@/componentes/mascotas/BadgeEstadoMascota";
import type { EstadoMascota, Mascota } from "@/lib/db/schema";
import { esFichaPublica } from "@/lib/mascotas/estados";
import Link from "next/link";

type Props = {
  mascota: Mascota & {
    fotoPrincipal: string | null;
    avistamientosPendientes?: number;
  };
};

export function TarjetaMascotaLista({ mascota }: Props) {
  if (!esTipoMascotaPermitido(mascota.tipo)) return null;

  const emoji = emojiPorTipo(mascota.tipo);
  const fichaUrl = `/mis-mascotas/${mascota.id}`;
  const esPublica = esFichaPublica(mascota.estado as EstadoMascota);

  return (
    <article className="mascota-tarjeta">
      <Link href={fichaUrl} className="mascota-tarjeta-enlace">
        <div className="mascota-tarjeta-foto">
          {mascota.fotoPrincipal ? (
            <img src={mascota.fotoPrincipal} alt={mascota.nombre} />
          ) : (
            <span className="mascota-tarjeta-foto-placeholder">{emoji}</span>
          )}
          <div className="mascota-tarjeta-badge">
            <BadgeEstadoMascota estado={mascota.estado as EstadoMascota} />
            {(mascota.avistamientosPendientes ?? 0) > 0 && (
              <span
                className="mascota-tarjeta-avist-pendiente"
                title="Avistamientos por revisar"
              >
                👁️ {mascota.avistamientosPendientes}
              </span>
            )}
          </div>
        </div>
        <div className="mascota-tarjeta-cuerpo">
          <h3>{mascota.nombre}</h3>
          <p className="mascota-tarjeta-meta">
            {mascota.tipo}
            {mascota.raza ? ` · ${mascota.raza}` : ""}
            {mascota.edad ? ` · ${mascota.edad}` : ""}
          </p>
          {mascota.estado === "PERDIDA" && mascota.lugarPerdida && (
            <p className="mascota-tarjeta-meta mascota-tarjeta-meta--ubicacion">
              📍 {mascota.lugarPerdida}
            </p>
          )}
        </div>
      </Link>
      {esPublica && (
        <div className="mascota-tarjeta-pie">
          <Link
            href={`/mascota/${mascota.slug}`}
            className="btn-mascota btn-mascota--secundario btn-mascota--compacto"
            target="_blank"
          >
            Ver ficha pública
          </Link>
        </div>
      )}
    </article>
  );
}
