"use client";



import { useCallback, useState, useTransition } from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import {

  gestionarEstadoAvistamiento,

  listarAvistamientosPorMascota,

  type AvistamientoConMensajes,

} from "@/actions/avistamientos";

import type { PrediccionComportamiento } from "@/lib/comportamiento/prediccion";

import { PanelComportamiento } from "@/componentes/comportamiento/PanelComportamiento";

import { Icono } from "@/componentes/ui/Icono";

import { useRespaldoActualizacion } from "@/hooks/useRespaldoActualizacion";

import { useTiempoReal } from "@/hooks/useTiempoReal";



type Props = {

  mascotaId: string;

  nombreMascota: string;

  avistamientosIniciales: AvistamientoConMensajes[];

  esDueno: boolean;

  prediccion: PrediccionComportamiento | null;

};



function etiquetaEstado(estado: string) {

  if (estado === "VERIFICADO") {
    return (
      <span className="timeline-avistamiento-estado-icono" aria-label="Verificado">
        <Icono nombre="check" size={14} className="pp-icon--btn" />
      </span>
    );
  }

  if (estado === "DESCARTADO") {

    return (

      <>

        <Icono nombre="cerrar" size={14} className="pp-icon--btn" />

        Descartado

      </>

    );

  }

  return (

    <>

      <Icono nombre="reloj" size={14} className="pp-icon--btn" />

      Pendiente

    </>

  );

}



export function SeccionAvistamientosMascota({

  mascotaId,

  nombreMascota,

  avistamientosIniciales,

  esDueno,

  prediccion,

}: Props) {

  const router = useRouter();

  const [lista, setLista] = useState(avistamientosIniciales);

  const [pendiente, iniciar] = useTransition();



  const recargar = useCallback(async () => {

    const nueva = await listarAvistamientosPorMascota(mascotaId, {

      dueno: esDueno,

      incluirDescartados: esDueno,

    });

    setLista(nueva);

    router.refresh();

  }, [mascotaId, esDueno, router]);



  const { conectado: wsConectado } = useTiempoReal([`mascota:${mascotaId}`], (evento) => {

    if (

      evento.tipo === "mensaje:nuevo" &&

      evento.mascotaId === mascotaId

    ) {

      if (esDueno) void recargar();

      return;

    }

    if (

      (evento.tipo === "avistamiento:nuevo" ||

        evento.tipo === "avistamiento:actualizado") &&

      evento.mascotaId === mascotaId

    ) {

      void recargar();

    }

  });



  useRespaldoActualizacion(() => {

    void recargar();

  }, wsConectado);



  const gestionar = (id: string, estado: "VERIFICADO" | "DESCARTADO") => {

    const motivo =

      estado === "DESCARTADO"

        ? window.prompt("Motivo del descarte (opcional)") ?? undefined

        : undefined;

    iniciar(async () => {

      const res = await gestionarEstadoAvistamiento(id, estado, motivo);

      if (res.ok) void recargar();

      else alert(res.error ?? "Error");

    });

  };



  return (

    <section

      id="avistamientos"

      className="seccion-avistamientos"

      aria-labelledby="avistamientos-titulo"

    >

      {prediccion && (

        <PanelComportamiento prediccion={prediccion} nombreMascota={nombreMascota} />

      )}



      <h2 id="avistamientos-titulo" className="ficha-publica-seccion-titulo">

        <Icono nombre="ojo" size={20} className="pp-icon--btn" />

        Avistamientos de {nombreMascota}

      </h2>

      <p className="seccion-avistamientos-intro">

        Reportes verificados en el mapa. La comunicación con testigos es privada:

        solo tú y quien reportó pueden chatear.

      </p>



      {esDueno && (

        <p className="pp-avistamiento-privado-cta">

          <Link href={`/mis-mascotas/${mascotaId}/caso`}>

            Abrir caso de búsqueda

            <Icono nombre="derecha" size={14} className="pp-icon--btn" />

          </Link>

          {" "}Chats centralizados. Los avisos llegan a la campana{" "}

          <Icono nombre="campana" size={14} className="pp-icon--btn" />

          del menú.

        </p>

      )}



      {lista.length === 0 ? (

        <p className="seccion-avistamientos-vacio">

          Aún no hay avistamientos. Sé el primero en reportar si ves a {nombreMascota}.

        </p>

      ) : (

        <ol className="timeline-avistamientos">

          {lista.map((av) => (

            <li key={av.id} className={`timeline-avistamiento timeline-avistamiento--${av.estado.toLowerCase()}`}>

              <div className="timeline-avistamiento-cabecera">

                <span className="timeline-avistamiento-num">#{av.numeroReporte}</span>

                <span className="timeline-avistamiento-estado">{etiquetaEstado(av.estado)}</span>

                <time>

                  {new Date(av.createdAt).toLocaleString("es-PE", {

                    dateStyle: "medium",

                    timeStyle: "short",

                  })}

                </time>

              </div>



              {av.direccion && (

                <p className="timeline-avistamiento-lugar">

                  <Icono nombre="ubicacion" size={14} className="pp-icon--btn" />

                  {av.direccion}

                </p>

              )}

              {av.descripcion && <p>{av.descripcion}</p>}

              {esDueno && av.nombreReportante && (

                <p className="timeline-avistamiento-reportante">

                  Reportó: <strong>{av.nombreReportante}</strong>

                  {av.telefonoReportante ? ` · ${av.telefonoReportante}` : ""}

                </p>

              )}

              {av.fotoUrl && (

                // eslint-disable-next-line @next/next/no-img-element

                <img

                  src={av.fotoUrl}

                  alt={`Foto avistamiento ${av.numeroReporte}`}

                  className="timeline-avistamiento-foto"

                />

              )}



              {esDueno && av.estado === "PENDIENTE" && (

                <div className="timeline-avistamiento-acciones">

                  <button

                    type="button"

                    disabled={pendiente}

                    onClick={() => gestionar(av.id, "VERIFICADO")}

                  >

                    Verificar

                  </button>

                  <button

                    type="button"

                    className="timeline-btn-descartar"

                    disabled={pendiente}

                    onClick={() => gestionar(av.id, "DESCARTADO")}

                  >

                    Descartar

                  </button>

                </div>

              )}



              {esDueno ? (

                <p className="pp-avistamiento-privado-cta">

                  <Link href={`/avistamiento/${av.id}`}>

                    Abrir chat privado

                    <Icono nombre="derecha" size={14} className="pp-icon--btn" />

                  </Link>

                </p>

              ) : (

                <p className="pp-avistamiento-privado-cta">

                  El dueño contactará al reportante de forma privada si hace falta.

                </p>

              )}

            </li>

          ))}

        </ol>

      )}

    </section>

  );

}

