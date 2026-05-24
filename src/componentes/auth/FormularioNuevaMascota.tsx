"use client";

import { crearMascota } from "@/actions/mascotas";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { TIPOS_MASCOTA } from "@/lib/mascotas/tipos";

export function FormularioNuevaMascota() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const resultado = await crearMascota({
      nombre: fd.get("nombre")?.toString() ?? "",
      tipo: fd.get("tipo")?.toString() ?? "",
      raza: fd.get("raza")?.toString(),
      sexo: fd.get("sexo")?.toString(),
      color: fd.get("color")?.toString(),
    });

    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={enviar}>
      {error && <p className="auth-alerta auth-alerta--error">{error}</p>}
      <div className="form-row">
        <div className="form-group">
          <label>Nombre *</label>
          <input name="nombre" type="text" required placeholder="Ej: Max" />
        </div>
        <div className="form-group">
          <label>Tipo *</label>
          <select name="tipo" required defaultValue="">
            <option value="">Seleccionar...</option>
            {TIPOS_MASCOTA.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Raza</label>
          <input name="raza" type="text" placeholder="Ej: Labrador" />
        </div>
        <div className="form-group">
          <label>Sexo</label>
          <input name="sexo" type="text" placeholder="Macho / Hembra" />
        </div>
      </div>
      <div className="form-group">
        <label>Color</label>
        <input name="color" type="text" placeholder="Ej: dorado" />
      </div>
      <button type="submit" disabled={cargando} className="submit-btn">
        {cargando ? "Guardando..." : "Añadir mascota"}
      </button>
    </form>
  );
}
