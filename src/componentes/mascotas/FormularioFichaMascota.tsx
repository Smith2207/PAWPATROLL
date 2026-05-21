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
      {modo === "crear" && (
        <p className="form-ficha-intro">
          🐾 Empieza con lo básico. Los campos con <span className="form-ficha-req">*</span> son
          obligatorios; el resto ayuda si la mascota se pierde.
        </p>
      )}

      {error && <p className="auth-alerta auth-alerta--error">{error}</p>}

      <div className="form-ficha-layout">
        <div className="form-ficha-columna">
          <section className="form-ficha-bloque">
            <h3 className="form-ficha-bloque-titulo">Lo esencial</h3>
            <div className="form-ficha-grid">
              <div className="form-group">
                <label>
                  Nombre <span className="form-ficha-req">*</span>
                </label>
                <input
                  name="nombre"
                  type="text"
                  required
                  defaultValue={mascota?.nombre}
                  placeholder="Ej: Max"
                />
              </div>
              <div className="form-group">
                <label>
                  Tipo <span className="form-ficha-req">*</span>
                </label>
                <select name="tipo" required defaultValue={mascota?.tipo ?? ""}>
                  <option value="">Elegir...</option>
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Raza</label>
                <input
                  name="raza"
                  type="text"
                  defaultValue={mascota?.raza ?? ""}
                  placeholder="Ej: Mestizo"
                />
              </div>
              <div className="form-group">
                <label>Sexo</label>
                <select name="sexo" defaultValue={mascota?.sexo ?? ""}>
                  <option value="">—</option>
                  {SEXOS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="form-ficha-bloque form-ficha-bloque--suave">
            <h3 className="form-ficha-bloque-titulo">
              Más detalles <span className="form-ficha-opcional">opcional</span>
            </h3>
            <div className="form-ficha-grid">
              <div className="form-group">
                <label>Color</label>
                <input
                  name="color"
                  type="text"
                  defaultValue={mascota?.color ?? ""}
                  placeholder="Ej: Marrón"
                />
              </div>
              <div className="form-group">
                <label>Tamaño</label>
                <select name="tamano" defaultValue={mascota?.tamano ?? ""}>
                  <option value="">—</option>
                  {TAMANOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Edad</label>
                <input
                  name="edad"
                  type="text"
                  defaultValue={mascota?.edad ?? ""}
                  placeholder="Ej: 3 años"
                />
              </div>
              <div className="form-group">
                <label>Peso</label>
                <input
                  name="peso"
                  type="text"
                  defaultValue={mascota?.peso ?? ""}
                  placeholder="Ej: 12 kg"
                />
              </div>
              <div className="form-group">
                <label>Collar / placa</label>
                <input name="collar" type="text" defaultValue={mascota?.collar ?? ""} />
              </div>
              <div className="form-group">
                <label>Microchip</label>
                <input name="microchip" type="text" defaultValue={mascota?.microchip ?? ""} />
              </div>
              <div className="form-group form-ficha-grid--ancho">
                <label>Contacto si se pierde</label>
                <input
                  name="contactoPublico"
                  type="text"
                  defaultValue={mascota?.contactoPublico ?? ""}
                  placeholder="Teléfono o correo"
                />
              </div>
              <div className="form-group form-ficha-grid--ancho">
                <label>Descripción breve</label>
                <textarea
                  name="descripcion"
                  rows={2}
                  defaultValue={mascota?.descripcion ?? ""}
                  placeholder="Personalidad, pelaje..."
                />
              </div>
              <div className="form-group form-ficha-grid--ancho">
                <label>Señas particulares</label>
                <textarea
                  name="senasParticulares"
                  rows={2}
                  defaultValue={mascota?.senasParticulares ?? ""}
                  placeholder="Cicatrices, manchas..."
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="form-ficha-lateral">
          <section className="form-ficha-bloque form-ficha-bloque--fotos">
            <h3 className="form-ficha-bloque-titulo">Fotos</h3>
            <p className="form-ficha-tip">
              Sube hasta 5. La primera será la principal en la ficha pública.
            </p>
            <SubirFotosMascota fotos={fotos} onFotosChange={onFotosChange} />
          </section>
        </aside>
      </div>

      <div className="form-ficha-acciones">
        <button type="submit" disabled={cargando} className="submit-btn">
          {cargando
            ? "Guardando..."
            : modo === "crear"
              ? "Crear ficha"
              : "Guardar ficha"}
        </button>
        <Link href="/mis-mascotas" className="btn-mascota btn-mascota--secundario">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
