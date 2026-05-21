"use client";

import { actualizarPerfil } from "@/actions/autenticacion";
import { useState } from "react";

type Props = {
  nombreInicial: string;
};

export function FormularioPerfil({ nombreInicial }: Props) {
  const [nombre, setNombre] = useState(nombreInicial);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const resultado = await actualizarPerfil({ nombre });
    if (resultado.ok) setMensaje(resultado.mensaje);
    else setError(resultado.error);
  }

  return (
    <form onSubmit={guardar}>
      {mensaje && <p className="auth-alerta auth-alerta--ok">{mensaje}</p>}
      {error && <p className="auth-alerta auth-alerta--error">{error}</p>}
      <div className="form-group">
        <label>Nombre</label>
        <input
          type="text"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>
      <button type="submit" className="submit-btn submit-btn-blue">
        Guardar cambios
      </button>
    </form>
  );
}
