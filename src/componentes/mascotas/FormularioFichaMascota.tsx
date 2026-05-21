"use client";

import {
  actualizarMascota,
  crearMascota,
} from "@/actions/mascotas";
import { SubirFotosMascota } from "@/componentes/mascotas/SubirFotosMascota";
import type { DatosFichaMascota, Mascota } from "@/lib/db/schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Props = {
  modo: "crear" | "editar";
  mascota?: Mascota;
  fotosIniciales?: string[];
};

const TIPOS = ["Perro", "Gato", "Ave", "Otro"];
const SEXOS = ["Macho", "Hembra"];
const TAMANOS = [
  "Pequeño (menos de 10 kg)",
  "Mediano (10–25 kg)",
  "Grande (más de 25 kg)",
];

export function FormularioFichaMascota({
  modo,
  mascota,
  fotosIniciales = [],
}: Props) {
  const router = useRouter();
  const [fotos, setFotos] = useState<string[]>(fotosIniciales);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const onFotosChange = useCallback((nuevas: string[]) => {
    setFotos(nuevas);
  }, []);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const datos: DatosFichaMascota = {
      nombre: fd.get("nombre")?.toString() ?? "",
      tipo: fd.get("tipo")?.toString() ?? "",
      raza: fd.get("raza")?.toString(),
      sexo: fd.get("sexo")?.toString(),
      color: fd.get("color")?.toString(),
      tamano: fd.get("tamano")?.toString(),
      edad: fd.get("edad")?.toString(),
      peso: fd.get("peso")?.toString(),
      descripcion: fd.get("descripcion")?.toString(),
      senasParticulares: fd.get("senasParticulares")?.toString(),
      collar: fd.get("collar")?.toString(),
      microchip: fd.get("microchip")?.toString(),
      contactoPublico: fd.get("contactoPublico")?.toString(),
    };

    const resultado =
      modo === "crear"
        ? await crearMascota(datos, fotos)
        : await actualizarMascota(mascota!.id, datos, fotos);

    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    if (modo === "crear" && "id" in resultado && resultado.id) {
      router.push(`/mis-mascotas/${resultado.id}`);
      return;
    }

    router.refresh();
    setError(null);
    alert(resultado.mensaje);
  }

  return (
    <form onSubmit={enviar} className="form-ficha">
      {error && <p className="auth-alerta auth-alerta--error">{error}</p>}

      <div className="section-divider">Datos de la mascota</div>

      <div className="form-row">
        <div className="form-group">
          <label>Nombre *</label>
          <input
            name="nombre"
            type="text"
            required
            defaultValue={mascota?.nombre}
            placeholder="Ej: Max"
          />
        </div>
        <div className="form-group">
          <label>Tipo *</label>
          <select name="tipo" required defaultValue={mascota?.tipo ?? ""}>
            <option value="">Seleccionar...</option>
            {TIPOS.map((t) => (
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
          <input name="raza" type="text" defaultValue={mascota?.raza ?? ""} />
        </div>
        <div className="form-group">
          <label>Sexo</label>
          <select name="sexo" defaultValue={mascota?.sexo ?? ""}>
            <option value="">Seleccionar...</option>
            {SEXOS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Color principal</label>
          <input name="color" type="text" defaultValue={mascota?.color ?? ""} />
        </div>
        <div className="form-group">
          <label>Tamaño</label>
          <select name="tamano" defaultValue={mascota?.tamano ?? ""}>
            <option value="">Seleccionar...</option>
            {TAMANOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Edad aproximada</label>
          <input name="edad" type="text" defaultValue={mascota?.edad ?? ""} />
        </div>
        <div className="form-group">
          <label>Peso</label>
          <input name="peso" type="text" defaultValue={mascota?.peso ?? ""} />
        </div>
      </div>

      <div className="section-divider">Identificación y contacto</div>

      <div className="form-row">
        <div className="form-group">
          <label>Collar / placa</label>
          <input name="collar" type="text" defaultValue={mascota?.collar ?? ""} />
        </div>
        <div className="form-group">
          <label>Microchip</label>
          <input
            name="microchip"
            type="text"
            defaultValue={mascota?.microchip ?? ""}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Contacto público (si se pierde)</label>
        <input
          name="contactoPublico"
          type="text"
          defaultValue={mascota?.contactoPublico ?? ""}
          placeholder="Teléfono o correo visible en la ficha pública"
        />
      </div>

      <div className="form-group">
        <label>Descripción general</label>
        <textarea
          name="descripcion"
          rows={2}
          defaultValue={mascota?.descripcion ?? ""}
        />
      </div>

      <div className="form-group">
        <label>Señas particulares</label>
        <textarea
          name="senasParticulares"
          rows={2}
          defaultValue={mascota?.senasParticulares ?? ""}
          placeholder="Cicatrices, manchas, comportamiento..."
        />
      </div>

      <div className="section-divider">Fotos</div>
      <SubirFotosMascota fotos={fotos} onFotosChange={onFotosChange} />

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
        <button type="submit" disabled={cargando} className="submit-btn">
          {cargando
            ? "Guardando..."
            : modo === "crear"
              ? "Crear ficha"
              : "Guardar cambios"}
        </button>
        <Link href="/mis-mascotas" className="btn-mascota btn-mascota--secundario">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
