"use client";



/**
 * [landing] Barra: busqueda.
 */
/**
 * [landing] Barra: busqueda.
 */
import { useEffect, useState } from "react";
import { useModales } from "@/contexto/ContextoModales";
import { Icono, type NombreIcono } from "@/componentes/ui/Icono";
import type { FiltrosBusquedaMascotasPublicas } from "@/actions/mascotas";
import type { TipoMascota } from "@/lib/mascotas/tipos";

const FILTROS_TIPO = [
  { id: "perros", icono: "perro" as const satisfies NombreIcono, texto: "Perros", tipo: "Perro" as const satisfies TipoMascota },
  { id: "gatos", icono: "gato" as const satisfies NombreIcono, texto: "Gatos", tipo: "Gato" as const satisfies TipoMascota },
  { id: "24h", icono: "reloj" as const satisfies NombreIcono, texto: "Últimas 24h", dias: 1 },
] as const;

type Props = {
  onBuscar: (filtros: FiltrosBusquedaMascotasPublicas) => void;
  buscando?: boolean;
  resetSignal?: number;
  busquedaActiva?: boolean;
  onRestablecer?: () => void;
};

export function BarraBusqueda({
  onBuscar,
  buscando,
  resetSignal = 0,
  busquedaActiva = false,
  onRestablecer,
}: Props) {
  const { abrirBusquedaPorFoto } = useModales();
  const [texto, setTexto] = useState("");
  const [filtroActivo, setFiltroActivo] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setTexto("");
      setFiltroActivo(null);
    });
  }, [resetSignal]);

  function chipActivo(): Partial<FiltrosBusquedaMascotasPublicas> {
    if (!filtroActivo) return {};
    const f = FILTROS_TIPO.find((x) => x.id === filtroActivo);
    if (!f) return {};
    if ("tipo" in f && f.tipo) return { tipo: f.tipo };
    if ("dias" in f && f.dias) return { dias: f.dias };
    return {};
  }

  function ejecutar(extra?: Partial<FiltrosBusquedaMascotasPublicas>) {
    onBuscar({
      q: texto.trim() || undefined,
      ...chipActivo(),
      ...extra,
    });
  }

  function aplicarFiltro(id: string) {
    const f = FILTROS_TIPO.find((x) => x.id === id);
    if (!f) return;

    const activo = filtroActivo === id;
    const q = texto.trim() || undefined;
    setFiltroActivo(activo ? null : id);

    if (activo) {
      onBuscar({ q });
      return;
    }

    if ("tipo" in f && f.tipo) {
      onBuscar({ q, tipo: f.tipo });
      return;
    }

    if ("dias" in f && f.dias) {
      onBuscar({ q, dias: f.dias });
    }
  }

  return (
    <div className="search-section" id="buscar">
      <div className="search-inner">
        <div className="search-box">
          <span className="search-icon" aria-hidden>
            <Icono nombre="buscar" size={18} />
          </span>
          <input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                ejecutar();
              }
            }}
            placeholder="Nombre, raza, color o zona…"
            aria-label="Buscar mascotas perdidas"
          />
        </div>
        <div className="search-acciones">
          <button
            type="button"
            className="search-btn"
            disabled={buscando}
            onClick={() => ejecutar()}
          >
            {buscando ? "Buscando…" : "Buscar"}
          </button>
          <button
            type="button"
            className="search-btn search-btn-foto"
            onClick={abrirBusquedaPorFoto}
          >
            <Icono nombre="camara" size={16} className="pp-icon--btn" />
            Por foto
          </button>
        </div>
        <div className="search-filtros" role="group" aria-label="Filtros rápidos">
          {FILTROS_TIPO.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`filter-btn${filtroActivo === f.id ? " active" : ""}`}
              onClick={() => aplicarFiltro(f.id)}
              disabled={buscando}
            >
              <Icono nombre={f.icono} size={16} className="pp-icon--btn" />
              {f.texto}
            </button>
          ))}
          {busquedaActiva && onRestablecer && (
            <button
              type="button"
              className="filter-btn filter-btn--limpiar"
              onClick={onRestablecer}
              disabled={buscando}
            >
              <Icono nombre="cerrar" size={14} className="pp-icon--btn" />
              Ver todos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
