import { BadgeEstadoMascota } from "@/componentes/mascotas/BadgeEstadoMascota";
import type { EstadoMascota, Mascota } from "@/lib/db/schema";
import { esFichaPublica } from "@/lib/mascotas/estados";
import Link from "next/link";

type Props = {
  mascota: Mascota & { fotoPrincipal: string | null };
};

const EMOJI_TIPO: Record<string, string> = {
  Perro: "🐕",
  Gato: "🐱",
  Ave: "🐦",
};

export function TarjetaMascotaLista({ mascota }: Props) {
  const emoji = EMOJI_TIPO[mascota.tipo] ?? "🐾";

  return (
    <article className="mascota-tarjeta">
      <div className="mascota-tarjeta-foto">
        {mascota.fotoPrincipal ? (
          <img src={mascota.fotoPrincipal} alt={mascota.nombre} />
        ) : (
          <span className="mascota-tarjeta-foto-placeholder">{emoji}</span>
        )}
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <BadgeEstadoMascota estado={mascota.estado as EstadoMascota} />
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
          <p className="mascota-tarjeta-meta">📍 {mascota.lugarPerdida}</p>
        )}
        <div className="mascota-tarjeta-acciones">
          <Link
            href={`/mis-mascotas/${mascota.id}`}
            className="btn-mascota btn-mascota--primario"
          >
            Ver ficha
          </Link>
          {esFichaPublica(mascota.estado as EstadoMascota) && (
            <Link
              href={`/mascota/${mascota.slug}`}
              className="btn-mascota btn-mascota--secundario"
              target="_blank"
            >
              Pública
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
