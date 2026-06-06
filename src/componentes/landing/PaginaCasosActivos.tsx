"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buscarMascotasPublicas,
  type FiltrosBusquedaMascotasPublicas,
} from "@/actions/mascotas";
import { BarraBusqueda } from "@/componentes/landing/BarraBusqueda";
import { EncabezadoPagina } from "@/componentes/landing/EncabezadoPagina";
import {
  SeccionMascotasRecientes,
  type MascotaPublicaTarjeta,
} from "@/componentes/landing/SeccionMascotasRecientes";
import { Icono } from "@/componentes/ui/Icono";
import {
  hayFiltrosBusqueda,
  mensajeSinResultados,
} from "@/lib/landing/mensajes-busqueda";
import { RUTAS_LANDING } from "@/lib/landing/rutas";
import Link from "next/link";

const LIMITE_LISTADO = 24;

type Props = {
  mascotasIniciales: MascotaPublicaTarjeta[];
};

export function PaginaCasosActivos({ mascotasIniciales }: Props) {
  const [mascotas, setMascotas] = useState(mascotasIniciales);
  const [buscando, setBuscando] = useState(false);
  const [filtrosActuales, setFiltrosActuales] = useState<FiltrosBusquedaMascotasPublicas>(
    {}
  );
  const [busquedaActiva, setBusquedaActiva] = useState(false);
  const [resetBarra, setResetBarra] = useState(0);
  const [errorBusqueda, setErrorBusqueda] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setMascotas(mascotasIniciales);
      setFiltrosActuales({});
      setBusquedaActiva(false);
      setErrorBusqueda(false);
    });
  }, [mascotasIniciales]);

  const ejecutarBusqueda = useCallback(
    async (filtros: FiltrosBusquedaMascotasPublicas) => {
      const conFiltros = hayFiltrosBusqueda(filtros);
      setBuscando(true);
      setErrorBusqueda(false);
      setFiltrosActuales(filtros);
      setBusquedaActiva(conFiltros);

      try {
        const resultado = await buscarMascotasPublicas({
          ...filtros,
          limite: LIMITE_LISTADO,
        });
        setMascotas(resultado);
      } catch {
        setErrorBusqueda(true);
        setMascotas([]);
      } finally {
        setBuscando(false);
      }
    },
    []
  );

  const restablecerListado = useCallback(async () => {
    setResetBarra((n) => n + 1);
    setBuscando(true);
    setErrorBusqueda(false);
    setFiltrosActuales({});
    setBusquedaActiva(false);
    try {
      const resultado = await buscarMascotasPublicas({ limite: LIMITE_LISTADO });
      setMascotas(resultado);
    } catch {
      setErrorBusqueda(true);
      setMascotas(mascotasIniciales);
    } finally {
      setBuscando(false);
    }
  }, [mascotasIniciales]);

  const mensajeVacio = errorBusqueda
    ? "No pudimos cargar el listado. Intenta de nuevo en un momento."
    : busquedaActiva
      ? mensajeSinResultados(filtrosActuales)
      : "Aún no hay mascotas perdidas publicadas en la comunidad.";

  return (
    <>
      <EncabezadoPagina
        eyebrow="Búsqueda"
        titulo="Casos activos"
        descripcion="Mascotas perdidas con página pública. Busca por nombre, raza, color o zona."
      />
      <BarraBusqueda
        onBuscar={ejecutarBusqueda}
        buscando={buscando}
        resetSignal={resetBarra}
        busquedaActiva={busquedaActiva}
        onRestablecer={() => void restablecerListado()}
      />
      <SeccionMascotasRecientes
        mascotas={mascotas}
        modoPaginaCasos
        busquedaActiva={busquedaActiva}
        mensajeVacio={mensajeVacio}
        onQuitarFiltros={() => void restablecerListado()}
      />
      {!busquedaActiva && mascotas.length > 0 && (
        <p className="pp-casos-enlace-mapa">
          <Link href={RUTAS_LANDING.comunidad} className="pp-enlace-icono">
            Ver todos en el mapa comunitario
            <Icono nombre="derecha" size={14} />
          </Link>
        </p>
      )}
    </>
  );
}
