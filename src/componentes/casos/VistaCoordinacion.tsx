"use client";



/**
 * [casos] Vista: coordinacion.
 */
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cambiarEstadoMascota } from "@/actions/mascotas";
import { PanelChatsCaso, type AvistamientoCaso } from "@/componentes/casos/PanelChatsCaso";
import { PanelContextualCaso } from "@/componentes/casos/PanelContextualCaso";
import { Icono } from "@/componentes/ui/Icono";
import type { Mascota } from "@/lib/db/schema";

type MascotaCaso = Mascota & { fotoPrincipal: string | null };

type ResumenCaso = {
  totalAvistamientos: number;
  pendientes: number;
  coincidenciasIa: number;
  ultimoAvistamientoDireccion: string | null;
  ultimoAvistamientoLat: string | null;
  ultimoAvistamientoLng: string | null;
};

type Props = {
  mascota: MascotaCaso;
  avistamientos: AvistamientoCaso[];
  resumen: ResumenCaso;
  miUserId: string;
};

export function VistaCoordinacion({
  mascota,
  avistamientos,
  resumen,
  miUserId,
}: Props) {
  const router = useRouter();
  const [ctxMovil, setCtxMovil] = useState(false);
  const [marcando, iniciarMarcar] = useTransition();

  function marcarEncontrado() {
    if (!window.confirm(`¿Confirmas que ${mascota.nombre} ya fue encontrada?`)) return;
    iniciarMarcar(async () => {
      const res = await cambiarEstadoMascota(mascota.id, "REUNIDA");
      if (res.ok) {
        router.push("/mis-mascotas");
        router.refresh();
      } else {
        alert(res.error ?? "No se pudo actualizar el estado.");
      }
    });
  }

  return (
    <div className="pp-coord">
      <nav className="pp-coord-nav" aria-label="Navegación">
        <Link href="/mis-mascotas" className="pp-coord-nav-enlace pp-enlace-icono">
          <Icono nombre="izquierda" size={14} />
          Mis mascotas
        </Link>
      </nav>

      <div className="pp-coord-layout">
        <section className="pp-coord-principal" aria-label="Conversaciones por reporte">
          <PanelChatsCaso
            mascota={mascota}
            avistamientos={avistamientos}
            miUserId={miUserId}
            resumen={resumen}
            onMarcarEncontrado={marcarEncontrado}
            marcando={marcando}
            onAbrirContexto={() => setCtxMovil(true)}
          />
        </section>

        <PanelContextualCaso
          mascota={mascota}
          avistamientos={avistamientos}
          resumen={resumen}
          movilAbierto={ctxMovil}
          onCerrarMovil={() => setCtxMovil(false)}
        />
      </div>
    </div>
  );
}

export type { AvistamientoCaso, ResumenCaso };
