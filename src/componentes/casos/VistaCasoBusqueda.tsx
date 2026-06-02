"use client";



import Link from "next/link";

import { PanelChatsCaso, type AvistamientoCaso } from "@/componentes/casos/PanelChatsCaso";

import { Icono } from "@/componentes/ui/Icono";

import type { Mascota } from "@/lib/db/schema";



type Props = {

  mascota: Mascota;

  avistamientos: AvistamientoCaso[];

};



export function VistaCasoBusqueda({ mascota, avistamientos }: Props) {

  const pendientes = avistamientos.filter((a) => a.estado === "PENDIENTE").length;



  return (

    <div className="pp-caso-busqueda">

      <nav className="pp-caso-nav" aria-label="Navegación del caso">

        <Link href="/mis-mascotas" className="pp-caso-nav-enlace pp-enlace-icono">

          <Icono nombre="izquierda" size={14} />

          Mis mascotas

        </Link>

      </nav>



      <header className="pp-caso-header">

        <div>

          <p className="pp-caso-eyebrow">Caso de búsqueda</p>

          <h1>{mascota.nombre}</h1>

  

        </div>

        <div className="pp-caso-stats">

          <span>{avistamientos.length} avistamientos</span>

          {pendientes > 0 && (

            <span className="pp-caso-stat-alerta">{pendientes} pendientes</span>

          )}

        </div>

      </header>



      <section className="pp-caso-panel pp-caso-panel--chats" aria-label="Chats de avistamientos">

        <PanelChatsCaso mascota={mascota} avistamientos={avistamientos} />

      </section>



      <div className="pp-caso-acciones">

        <Link href="/mis-mascotas" className="btn-mascota btn-mascota--secundario pp-enlace-icono">

          <Icono nombre="izquierda" size={14} />

          Volver al listado

        </Link>

        <Link href={`/mascota/${mascota.slug}`} className="btn-mascota btn-mascota--secundario">

          Ver ficha pública

        </Link>

        <Link href={`/mis-mascotas/${mascota.id}`} className="btn-mascota btn-mascota--secundario">

          Editar ficha

        </Link>

      </div>

    </div>

  );

}

