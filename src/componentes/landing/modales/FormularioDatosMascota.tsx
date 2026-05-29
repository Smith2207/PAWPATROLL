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
};

export function FormularioDatosMascota({
  tipoInicial = "",
  razaInicial,
  valoresIniciales,
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

  return (
    <>
      <div className="section-divider">Datos de la mascota</div>

      <input
        type="hidden"
        name="raza"
        value={componerRaza(razaSeleccion, razaOtra)}
      />

      <div className="form-row">
        <div className="form-group">
          <label>Nombre de la mascota *</label>
          <input
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
          <label>Color principal</label>
          <input
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
        defaultValue={valoresIniciales?.accesoExterior}
        requerido
      />

      <div className="form-row">
        <div className="form-group">
          <label>Edad aproximada</label>
          <input
            name="edad"
            type="text"
            placeholder="Ej: 3 años"
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

      <div className="section-divider">Accesorios e identificación</div>

      <div className="form-group">
        <label>Descripción adicional</label>
        <textarea
          name="descripcion"
          rows={2}
          placeholder="Señas particulares, collar azul, cicatrices, comportamiento especial..."
          defaultValue={valoresIniciales?.descripcion ?? ""}
        />
      </div>
    </>
  );
}
