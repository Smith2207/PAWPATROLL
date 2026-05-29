"use client";

import { valorDatetimeLocalActual } from "@/lib/fechas/datetime-local";

type Props = {
  label: string;
  name?: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (valor: string) => void;
  requerido?: boolean;
};

/**
 * Fecha y hora con valor por defecto = ahora (editable).
 */
export function CampoFechaHora({
  label,
  name,
  id,
  value,
  defaultValue,
  onChange,
  requerido = false,
}: Props) {
  const controlado = value !== undefined;
  const defecto = defaultValue ?? valorDatetimeLocalActual();

  return (
    <div className="form-group">
      <label htmlFor={id}>
        {label}
        {requerido ? " *" : ""}
      </label>
      <input
        id={id}
        name={name}
        type="datetime-local"
        required={requerido}
        value={controlado ? value : undefined}
        defaultValue={controlado ? undefined : defecto}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      />
    </div>
  );
}
