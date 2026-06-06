"use client";

import { useState } from "react";
import { CampoRaza } from "@/componentes/formulario/CampoRaza";
import { CampoSexo } from "@/componentes/formulario/CampoSexo";
import { CampoTamano } from "@/componentes/formulario/CampoTamano";
import { CampoTipoMascota } from "@/componentes/formulario/CampoTipoMascota";
import { CampoFechaHora } from "@/componentes/formulario/CampoFechaHora";
import { CampoAccesoExterior } from "@/componentes/formulario/CampoAccesoExterior";
import {
  componerRaza,
  obtenerRazasPorTipo,
  OPCION_RAZA_OTRA,
  parsearRaza,
} from "@/lib/mascotas/razas";

export type ValoresInicialesFichaMascota = {
  nombre?: string;
  tipo?: string;
  raza?: string | null;
  sexo?: string;
  color?: string;
  tamano?: string;
  edad?: string;
  descripcion?: string;
  fechaPerdida?: string;
  accesoExterior?: string;
};

type Props = {
  tipoInicial?: string;
  razaInicial?: string | null;
  valoresIniciales?: ValoresInicialesFichaMascota;
  /** Wizard: 1 esencial, 2 detalles, 3 contacto (campos ocultos). Sin valor = formulario completo visible. */
  pasoActivo?: 1 | 2 | 3;
};

function clasePaso(seccion: 1 | 2, paso?: 1 | 2 | 3) {
  if (!paso) return "";
  if (seccion === 1) return paso === 1 ? "" : "pp-wizard-oculto";
  return paso === 2 ? "" : "pp-wizard-oculto";
}

export function FormularioDatosMascota({
  tipoInicial = "",
  razaInicial,
  valoresIniciales,
  pasoActivo,
}: Props) {
  const tipoIni = valoresIniciales?.tipo ?? tipoInicial;
  const razaIni = valoresIniciales?.raza ?? razaInicial;

  const [tipo, setTipo] = useState(tipoIni);
  const razaParseada = parsearRaza(tipo, razaIni);
  const [razaSeleccion, setRazaSeleccion] = useState(razaParseada.seleccion);
  const [razaOtra, setRazaOtra] = useState(razaParseada.otra);

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

  const wizard = pasoActivo != null;

  return (
    <>
      <input
        type="hidden"
        name="raza"
        value={componerRaza(razaSeleccion, razaOtra)}
      />

      <div className={clasePaso(1, pasoActivo)}>
        {!wizard && <div className="section-divider">Datos de la mascota</div>}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="mascota-nombre">Nombre de la mascota *</label>
            <input
              id="mascota-nombre"
              name="nombre"
              type="text"
              placeholder="Ej: Max"
              required
              defaultValue={valoresIniciales?.nombre ?? ""}
            />
          </div>
          <CampoTipoMascota
            value={tipo}
            onChange={onTipoChange}
            requerido
            label="Perro o gato"
          />
        </div>
      </div>

      <div className={clasePaso(2, pasoActivo)}>
        {wizard && pasoActivo === 2 && (
          <div className="section-divider">Más detalles</div>
        )}
        <div className="form-row">
          <CampoRaza
            tipo={tipo}
            seleccion={razaSeleccion}
            otra={razaOtra}
            onSeleccionChange={setRazaSeleccion}
            onOtraChange={setRazaOtra}
          />
          <CampoSexo defaultValue={valoresIniciales?.sexo ?? ""} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="mascota-color">Color principal</label>
            <input
              id="mascota-color"
              name="color"
              type="text"
              placeholder="Ej: Dorado, marrón"
              defaultValue={valoresIniciales?.color ?? ""}
            />
          </div>
          <CampoTamano
            label="Tamaño"
            defaultValue={valoresIniciales?.tamano ?? ""}
          />
        </div>

        <CampoAccesoExterior
          tipo={tipo}
          defaultValue={valoresIniciales?.accesoExterior}
          requerido
        />

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="mascota-edad">Edad aproximada</label>
            <input
              id="mascota-edad"
              name="edad"
              type="text"
              placeholder="Ej: 3 años (opcional)"
              defaultValue={valoresIniciales?.edad ?? ""}
            />
          </div>
          <CampoFechaHora
            label="Fecha y hora de pérdida"
            name="fechaPerdida"
            requerido
            defaultValue={valoresIniciales?.fechaPerdida}
          />
        </div>

        {!wizard && (
          <div className="section-divider">Accesorios e identificación</div>
        )}

        <div className="form-group">
          <label htmlFor="mascota-descripcion">Descripción adicional</label>
          <textarea
            id="mascota-descripcion"
            name="descripcion"
            rows={2}
            placeholder="Collar, señas particulares, comportamiento… (opcional)"
            defaultValue={valoresIniciales?.descripcion ?? ""}
          />
        </div>
      </div>
    </>
  );
}
