"use client";

import {
  obtenerRazasPorTipo,
  OPCION_RAZA_OTRA,
} from "@/lib/mascotas/razas";

type Props = {
  tipo: string;
  seleccion: string;
  otra: string;
  onSeleccionChange: (valor: string) => void;
  onOtraChange: (valor: string) => void;
  label?: string;
  requerido?: boolean;
  deshabilitado?: boolean;
  classNameSecundario?: string;
};

export function CampoRaza({
  tipo,
  seleccion,
  otra,
  onSeleccionChange,
  onOtraChange,
  label = "Raza",
  requerido = false,
  deshabilitado = false,
  classNameSecundario = "form-ficha-campo-secundario",
}: Props) {
  const razas = obtenerRazasPorTipo(tipo);
  const sinTipo = !tipo.trim();

  return (
    <div className="form-group">
      <label>
        {label}
        {requerido ? " *" : ""}
      </label>
      <select
        value={seleccion}
        onChange={(e) => onSeleccionChange(e.target.value)}
        disabled={deshabilitado || sinTipo}
        required={requerido && !sinTipo}
        aria-label={label}
      >
        <option value="">
          {sinTipo ? "Primero elige perro o gato" : "Seleccionar..."}
        </option>
        {razas.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {seleccion === OPCION_RAZA_OTRA && (
        <input
          type="text"
          className={classNameSecundario}
          value={otra}
          onChange={(e) => onOtraChange(e.target.value)}
          placeholder="Escribe la raza"
          disabled={deshabilitado}
          aria-label="Raza personalizada"
        />
      )}
    </div>
  );
}
