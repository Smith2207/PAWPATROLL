"use client";

import { crearMascota } from "@/actions/mascotas";
import { CampoRaza } from "@/componentes/formulario/CampoRaza";
import { CampoSexo } from "@/componentes/formulario/CampoSexo";
import { CampoTipoMascota } from "@/componentes/formulario/CampoTipoMascota";
import {
  componerRaza,
  obtenerRazasPorTipo,
  OPCION_RAZA_OTRA,
} from "@/lib/mascotas/razas";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function FormularioNuevaMascota() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [tipo, setTipo] = useState("");
  const [razaSeleccion, setRazaSeleccion] = useState("");
  const [razaOtra, setRazaOtra] = useState("");

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const resultado = await crearMascota({
      nombre: fd.get("nombre")?.toString() ?? "",
      tipo: fd.get("tipo")?.toString() ?? "",
      raza: componerRaza(razaSeleccion, razaOtra) || undefined,
      sexo: fd.get("sexo")?.toString(),
      color: fd.get("color")?.toString(),
    });

    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    e.currentTarget.reset();
    setTipo("");
    setRazaSeleccion("");
    setRazaOtra("");
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
        <CampoTipoMascota
          value={tipo}
          onChange={(nuevoTipo) => {
            setTipo(nuevoTipo);
            if (
              razaSeleccion &&
              razaSeleccion !== OPCION_RAZA_OTRA &&
              !obtenerRazasPorTipo(nuevoTipo).includes(razaSeleccion)
            ) {
              setRazaSeleccion("");
              setRazaOtra("");
            }
          }}
          requerido
          label="Tipo"
        />
      </div>
      <div className="form-row">
        <CampoRaza
          tipo={tipo}
          seleccion={razaSeleccion}
          otra={razaOtra}
          onSeleccionChange={setRazaSeleccion}
          onOtraChange={setRazaOtra}
        />
        <CampoSexo />
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
