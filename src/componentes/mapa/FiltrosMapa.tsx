"use client";

import {
  OPCIONES_DIAS_MAPA,
  type FiltrosMapaPublico,
} from "@/lib/mapa/filtros";

type Props = {
  filtros: FiltrosMapaPublico;
  onChange: (f: FiltrosMapaPublico) => void;
};

export function FiltrosMapa({ filtros, onChange }: Props) {
  return (
    <div className="pp-mapa-filtros" role="group" aria-label="Filtros del mapa">
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
          <option value="Perro">🐕 Perros</option>
          <option value="Gato">🐱 Gatos</option>
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
    </div>
  );
}
