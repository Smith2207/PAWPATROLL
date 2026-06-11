"use client";

/**
 * [mapa] Filtros del mapa público (tipo, período, estado).
 */
import type { ReactNode } from "react";
import {
  OPCIONES_DIAS_MAPA,
  type FiltrosMapaPublico,
} from "@/lib/mapa/filtros";

type Props = {
  filtros: FiltrosMapaPublico;
  onChange: (f: FiltrosMapaPublico) => void;
  /** Mapa comunitario: solo pins de pérdida */
  soloPerdidas?: boolean;
  /** Barra horizontal compacta o flotante sobre el mapa */
  variante?: "tarjeta" | "barra" | "sobre-mapa";
  /** Leyenda u otros controles bajo los selectores */
  pie?: ReactNode;
  /** Texto alineado a la derecha en la fila de filtros */
  conteo?: ReactNode;
};

export function FiltrosMapa({
  filtros,
  onChange,
  soloPerdidas = false,
  variante = "tarjeta",
  pie,
  conteo,
}: Props) {
  return (
    <div
      className={`pp-mapa-filtros${variante === "barra" ? " pp-mapa-filtros--barra" : ""}${variante === "sobre-mapa" ? " pp-mapa-filtros--sobre-mapa" : ""}${pie ? " pp-mapa-filtros--con-pie" : ""}${conteo ? " pp-mapa-filtros--con-conteo" : ""}`}
      role="group"
      aria-label="Filtros del mapa"
    >
      <div className="pp-mapa-filtros-campos">
      <label className="pp-mapa-filtro">
        <span>Tipo</span>
        <select
          value={filtros.tipoMascota ?? ""}
          onChange={(e) =>
            onChange({
              ...filtros,
              tipoMascota: e.target.value as FiltrosMapaPublico["tipoMascota"],
            })
          }
        >
          <option value="">Todos</option>
          <option value="Perro">Perros</option>
          <option value="Gato">Gatos</option>
        </select>
      </label>

      <label className="pp-mapa-filtro">
        <span>Período</span>
        <select
          value={filtros.dias ?? 0}
          onChange={(e) =>
            onChange({ ...filtros, dias: Number(e.target.value) })
          }
        >
          {OPCIONES_DIAS_MAPA.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      </label>

      {!soloPerdidas && (
        <label className="pp-mapa-filtro">
          <span>Estado avist.</span>
          <select
            value={filtros.estadoAvistamiento ?? ""}
            onChange={(e) =>
              onChange({
                ...filtros,
                estadoAvistamiento: e.target
                  .value as FiltrosMapaPublico["estadoAvistamiento"],
              })
            }
          >
            <option value="">Todos (sin descartados)</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="VERIFICADO">Verificados</option>
          </select>
        </label>
      )}
      {conteo ? <span className="pp-mapa-filtros-conteo">{conteo}</span> : null}
      </div>
      {pie ? <div className="pp-mapa-filtros-pie">{pie}</div> : null}
    </div>
  );
}
