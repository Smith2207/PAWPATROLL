"use client";

import {
  actualizarMascota,
  crearMascota,
} from "@/actions/mascotas";
import { SubirFotosMascota } from "@/componentes/mascotas/SubirFotosMascota";
import type { DatosFichaMascota, Mascota } from "@/lib/db/schema";
import {
  componerContactoPublico,
  componerEdad,
  componerMicrochip,
  componerPeso,
  parsearEdad,
  parsearMicrochip,
  parsearPeso,
  resolverContactoInicial,
  type UnidadEdad,
} from "@/lib/mascotas/formatoFicha";
import {
  componerRaza,
  obtenerRazasPorTipo,
  OPCION_RAZA_OTRA,
  parsearRaza,
} from "@/lib/mascotas/razas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Props = {
  modo: "crear" | "editar";
  mascota?: Mascota;
  fotosIniciales?: string[];
  contactoPerfil?: { email: string; telefono?: string | null };
};

import { TIPOS_MASCOTA } from "@/lib/mascotas/tipos";
import { SEXOS, TAMANOS } from "@/lib/mascotas/catalogos";
import { CampoRaza } from "@/componentes/formulario/CampoRaza";
import { CampoAccesoExterior } from "@/componentes/formulario/CampoAccesoExterior";

export function FormularioFichaMascota({
  modo,
  mascota,
  fotosIniciales = [],
  contactoPerfil,
}: Props) {
  const router = useRouter();
  const tipoInicial = mascota?.tipo ?? "";
  const razaInicial = parsearRaza(tipoInicial, mascota?.raza);
  const edadInicial = parsearEdad(mascota?.edad);
  const pesoInicial = parsearPeso(mascota?.peso);
  const microchipInicial = parsearMicrochip(mascota?.microchip);
  const contactoInicial = resolverContactoInicial(
    mascota?.contactoPublico,
    contactoPerfil
  );

  const [fotos, setFotos] = useState<string[]>(fotosIniciales);
  const [tipo, setTipo] = useState(tipoInicial);
  const [razaSeleccion, setRazaSeleccion] = useState(razaInicial.seleccion);
  const [razaOtra, setRazaOtra] = useState(razaInicial.otra);
  const [edadValor, setEdadValor] = useState(edadInicial.valor);
  const [edadUnidad, setEdadUnidad] = useState<UnidadEdad>(edadInicial.unidad);
  const [pesoValor, setPesoValor] = useState(pesoInicial.valor.replace(/\s*kg\s*$/i, "").trim());
  const [microchipTiene, setMicrochipTiene] = useState<"" | "si" | "no">(
    microchipInicial.tiene
  );
  const [microchipNumero, setMicrochipNumero] = useState(microchipInicial.numero);
  const [contactoTelefono, setContactoTelefono] = useState(contactoInicial.telefono);
  const [contactoEmail, setContactoEmail] = useState(contactoInicial.email);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const onFotosChange = useCallback((nuevas: string[]) => {
    setFotos(nuevas);
  }, []);

  function onTipoChange(nuevoTipo: string) {
    setTipo(nuevoTipo);
    if (
      razaSeleccion &&
      razaSeleccion !== OPCION_RAZA_OTRA &&
      !obtenerRazasPorTipo(nuevoTipo).includes(razaSeleccion)
    ) {
      setRazaSeleccion("");
      setRazaOtra("");
    }
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const datos: DatosFichaMascota = {
      nombre: fd.get("nombre")?.toString() ?? "",
      tipo: fd.get("tipo")?.toString() ?? "",
      raza: componerRaza(razaSeleccion, razaOtra),
      sexo: fd.get("sexo")?.toString(),
      color: fd.get("color")?.toString(),
      tamano: fd.get("tamano")?.toString(),
      edad: componerEdad(edadValor, edadUnidad, true),
      peso: componerPeso(pesoValor, true),
      descripcion: fd.get("descripcion")?.toString(),
      senasParticulares: fd.get("senasParticulares")?.toString(),
      collar: fd.get("collar")?.toString(),
      microchip: componerMicrochip(microchipTiene, microchipNumero),
      contactoPublico: componerContactoPublico(contactoTelefono, contactoEmail),
      enfermedades: fd.get("enfermedades")?.toString(),
      accesoExterior: fd.get("accesoExterior")?.toString(),
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
                <select
                  name="tipo"
                  required
                  value={tipo}
                  onChange={(e) => onTipoChange(e.target.value)}
                >
                  <option value="">Elegir...</option>
                  {TIPOS_MASCOTA.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <CampoRaza
                tipo={tipo}
                seleccion={razaSeleccion}
                otra={razaOtra}
                onSeleccionChange={setRazaSeleccion}
                onOtraChange={setRazaOtra}
                classNameSecundario="form-ficha-campo-secundario"
              />
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
              <div className="form-group form-ficha-grid--ancho">
                <CampoAccesoExterior defaultValue={mascota?.accesoExterior} />
              </div>
              <div className="form-group">
                <label>Edad</label>
                <p className="form-ficha-ayuda">
                  Puede ser aproximada si no recuerdas la exacta.
                </p>
                <div className="form-ficha-campo-compuesto">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={edadValor}
                    onChange={(e) => setEdadValor(e.target.value)}
                    placeholder="Ej: 3 (aprox.)"
                    aria-label="Edad aproximada"
                  />
                  <select
                    value={edadUnidad}
                    onChange={(e) => setEdadUnidad(e.target.value as UnidadEdad)}
                    aria-label="Unidad de edad"
                  >
                    <option value="años">años</option>
                    <option value="meses">meses</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Peso</label>
                <p className="form-ficha-ayuda">
                  Puede ser aproximado si no recuerdas el exacto.
                </p>
                <div className="form-ficha-campo-compuesto">
                  <input
                    type="text"
                    value={pesoValor}
                    onChange={(e) => setPesoValor(e.target.value)}
                    placeholder="Ej: 12 (aprox.)"
                    aria-label="Peso aproximado en kilogramos"
                  />
                  <span className="form-ficha-sufijo">kg</span>
                </div>
              </div>
              <div className="form-group form-ficha-grid--ancho">
                <label htmlFor="collar">
                  ¿Lleva collar o placa identificatoria?
                </label>
                <p className="form-ficha-ayuda">
                  Describe el collar, la placa o cualquier dato que ayude a reconocerla
                  (color, nombre grabado, teléfono en la placa, etc.).
                </p>
                <input
                  id="collar"
                  name="collar"
                  type="text"
                  defaultValue={mascota?.collar ?? ""}
                  placeholder="Ej: Collar rojo con placa plateada que dice 'Luna'"
                />
              </div>
              <div className="form-group">
                <label htmlFor="microchip-tiene">Microchip</label>
                <select
                  id="microchip-tiene"
                  value={microchipTiene}
                  onChange={(e) =>
                    setMicrochipTiene(e.target.value as "" | "si" | "no")
                  }
                >
                  <option value="">Elegir...</option>
                  <option value="si">Sí cuenta con microchip</option>
                  <option value="no">No cuenta con microchip</option>
                </select>
                {microchipTiene === "si" && (
                  <input
                    type="text"
                    className="form-ficha-campo-secundario"
                    value={microchipNumero}
                    onChange={(e) => setMicrochipNumero(e.target.value)}
                    placeholder="Número del microchip (opcional)"
                    aria-label="Número de microchip"
                  />
                )}
              </div>
              <div className="form-group form-ficha-grid--ancho">
                <label>Contacto si se pierde</label>
                <p className="form-ficha-ayuda">
                  Por defecto usamos tu correo y teléfono del perfil. Puedes
                  cambiarlos aquí si quieres otro contacto solo para esta ficha.
                </p>
                <input
                  type="tel"
                  value={contactoTelefono}
                  onChange={(e) => setContactoTelefono(e.target.value)}
                  placeholder="Celular o teléfono"
                  aria-label="Teléfono de contacto"
                />
                <input
                  type="email"
                  className="form-ficha-campo-secundario"
                  value={contactoEmail}
                  onChange={(e) => setContactoEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  aria-label="Correo de contacto"
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
                <label>¿Tiene alguna enfermedad o condición de salud?</label>
                <p className="form-ficha-ayuda">
                  Información importante si se pierde: alergias, medicación, diabetes,
                  problemas cardíacos, etc. Si no tiene, puedes dejarlo en blanco.
                </p>
                <textarea
                  name="enfermedades"
                  rows={2}
                  defaultValue={mascota?.enfermedades ?? ""}
                  placeholder="Ej: Toma medicamento para el corazón / No tiene enfermedades conocidas"
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
              Sube hasta 5 imágenes. La primera será la principal en la ficha pública.
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
