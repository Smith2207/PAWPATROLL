import { esTipoMascotaPermitido } from "@/lib/mascotas/tipos";

import { BadgeEstadoMascota } from "@/componentes/mascotas/BadgeEstadoMascota";

import { Icono, iconoPorTipoMascota } from "@/componentes/ui/Icono";

import type { EstadoMascota, Mascota } from "@/lib/db/schema";

import { esFichaPublica } from "@/lib/mascotas/estados";

import Link from "next/link";



type Props = {

  mascota: Mascota & {

    fotoPrincipal: string | null;

    avistamientosPendientes?: number;

    totalAvistamientos?: number;

  };

};



export function TarjetaMascotaLista({ mascota }: Props) {

  if (!esTipoMascotaPermitido(mascota.tipo)) return null;



  const iconoTipo = iconoPorTipoMascota(mascota.tipo);

  const esPerdida = mascota.estado === "PERDIDA";

  const fichaUrl = `/mis-mascotas/${mascota.id}`;

  const casoUrl = `/mis-mascotas/${mascota.id}/caso`;

  const urlPrincipal = esPerdida ? casoUrl : fichaUrl;

  const esPublica = esFichaPublica(mascota.estado as EstadoMascota);



  return (

    <article className="mascota-tarjeta">

      <Link href={urlPrincipal} className="mascota-tarjeta-enlace">

        <div className="mascota-tarjeta-foto">

          {mascota.fotoPrincipal ? (

            <img src={mascota.fotoPrincipal} alt={mascota.nombre} />

          ) : (

            <span className="mascota-tarjeta-foto-placeholder">

              <Icono nombre={iconoTipo} size={40} />

            </span>

          )}

          <div className="mascota-tarjeta-badge">

            <BadgeEstadoMascota estado={mascota.estado as EstadoMascota} />

            {(mascota.avistamientosPendientes ?? 0) > 0 && (

              <span

                className="mascota-tarjeta-avist-pendiente"

                title="Avistamientos por revisar"

              >

                <Icono nombre="ojo" size={14} className="pp-icon--btn" />{" "}

                {mascota.avistamientosPendientes}

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

          {esPerdida && (mascota.totalAvistamientos ?? 0) > 0 && (

            <p className="mascota-tarjeta-meta mascota-tarjeta-meta--caso">

              <Icono nombre="mensaje" size={14} className="pp-icon--btn" />{" "}

              {mascota.totalAvistamientos} avistamiento

              {mascota.totalAvistamientos === 1 ? "" : "s"} · toca para chats

            </p>

          )}

          {esPerdida && mascota.lugarPerdida && (

            <p className="mascota-tarjeta-meta mascota-tarjeta-meta--ubicacion">

              <Icono nombre="ubicacion" size={14} className="pp-icon--btn" />{" "}

              {mascota.lugarPerdida}

            </p>

          )}

        </div>

      </Link>

      <div className="mascota-tarjeta-pie">

        <div className="mascota-tarjeta-acciones">

          {esPerdida ? (

            <>

              <Link href={casoUrl} className="btn-mascota btn-mascota--compacto">

                <Icono nombre="mensaje" size={14} className="pp-icon--btn" />

                Chats y avistamientos

              </Link>

              <Link

                href={fichaUrl}

                className="btn-mascota btn-mascota--secundario btn-mascota--compacto"

              >

                Editar ficha

              </Link>

            </>

          ) : (

            <Link href={fichaUrl} className="btn-mascota btn-mascota--secundario btn-mascota--compacto">

              Editar ficha

            </Link>

          )}

          {esPublica && (

            <Link

              href={`/mascota/${mascota.slug}`}

              className="btn-mascota btn-mascota--secundario btn-mascota--compacto"

              target="_blank"

            >

              Ficha pública

            </Link>

          )}

        </div>

      </div>

    </article>

  );

}

