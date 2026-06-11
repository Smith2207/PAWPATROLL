"use client";



/**
 * [auth] Campo: contrasena.
 */
import { useState, type ReactNode } from "react";
import { Icono } from "@/componentes/ui/Icono";

type Props = {
  id?: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  labelExtra?: ReactNode;
};

export function CampoContrasena({
  id,
  label,
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete = "new-password",
  minLength = 8,
  required = true,
  labelExtra,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-group">
      {labelExtra ? (
        <div className="form-group-label-row">
          <label htmlFor={id}>{label}</label>
          {labelExtra}
        </div>
      ) : (
        <label htmlFor={id}>{label}</label>
      )}
      <div className="campo-contrasena">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required={required}
          {...(minLength > 0 ? { minLength } : {})}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="campo-contrasena-ojo"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          tabIndex={-1}
        >
          <Icono nombre={visible ? "ojoOff" : "ojo"} size={18} />
        </button>
      </div>
    </div>
  );
}
