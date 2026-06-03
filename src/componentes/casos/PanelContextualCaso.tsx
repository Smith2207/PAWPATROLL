"use client";

import { useState } from "react";
import type { Avistamiento, Mascota } from "@/lib/db/schema";

type MascotaCaso = Mascota & { fotoPrincipal: string | null };
import { Icono } from "@/componentes/ui/Icono";

type Resumen = {
  totalAvistamientos: number;
  pendientes: number;
  coincidenciasIa: number;
  ultimoAvistamientoDireccion: string | null;
};

type Props = {
  mascota: MascotaCaso;
  avistamientos: Pick<
    Avistamiento,
    "id" | "numeroReporte" | "estado" | "direccion" | "createdAt"
  >[];
  resumen: Resumen;
  movilAbierto?: boolean;
  onCerrarMovil?: () => void;
};

function etiquetaEstado(estado: Avistamiento["estado"]) {
  if (estado === "VERIFICADO") return "Verificado";
  if (estado === "DESCARTADO") return "Descartado";
  return "Pendiente";
}

export function PanelContextualCaso({
  mascota,
  avistamientos,
  resumen,
  movilAbierto,
  onCerrarMovil,
}: Props) {
  const [localAbierto, setLocalAbierto] = useState(false);
  const abierto = movilAbierto ?? localAbierto;
  const cerrar = onCerrarMovil ?? (() => setLocalAbierto(false));

  const recientes = avistamientos.slice(0, 4);

  const contenido = (
    <>
      <div className="pp-coord-ctx-foto">
        {mascota.fotoPrincipal ? (
          <img src={mascota.fotoPrincipal} alt="" />
        ) : (
          <span className="pp-coord-ctx-foto-placeholder" aria-hidden>
            <Icono nombre={mascota.tipo === "Gato" ? "gato" : "perro"} size={32} />
          </span>
        )}
      </div>
      <div className="pp-coord-ctx-datos">
        <strong>{mascota.nombre}</strong>
        <span>
          {mascota.tipo}
          {mascota.raza ? ` · ${mascota.raza}` : ""}
        </span>
      </div>
      <dl className="pp-coord-ctx-stats">
        <div>
          <dt>Avistamientos</dt>
          <dd>{resumen.totalAvistamientos}</dd>
        </div>
        <div>
          <dt>Pendientes</dt>
          <dd>{resumen.pendientes}</dd>
        </div>
        <div>
          <dt>Coincidencias IA</dt>
          <dd>{resumen.coincidenciasIa}</dd>
        </div>
      </dl>
      {resumen.ultimoAvistamientoDireccion && (
        <p className="pp-coord-ctx-ubicacion">
          <Icono nombre="ubicacion" size={14} />
          {resumen.ultimoAvistamientoDireccion}
        </p>
      )}
      {recientes.length > 0 && (
        <section className="pp-coord-ctx-seccion">
          <h3>Últimos avistamientos</h3>
          <ul>
            {recientes.map((av) => (
              <li key={av.id}>
                <span>#{av.numeroReporte}</span>
                <span>{etiquetaEstado(av.estado)}</span>
                {av.direccion && <small>{av.direccion.slice(0, 40)}</small>}
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="pp-coord-ctx-estado">
        Estado:{" "}
        <strong className="pp-coord-estado pp-coord-estado--activa">
          Búsqueda activa
        </strong>
      </p>
    </>
  );

  return (
    <>
      <button
        type="button"
        className="pp-coord-ctx-toggle"
        onClick={() => setLocalAbierto(true)}
        aria-label="Ver contexto del caso"
      >
        <Icono nombre="info" size={18} />
      </button>

      <aside className="pp-coord-ctx" aria-label="Contexto del caso">
        <div className="pp-coord-ctx-inner">{contenido}</div>
      </aside>

      {abierto && (
        <div className="pp-coord-ctx-sheet" role="dialog" aria-label="Contexto">
          <button
            type="button"
            className="pp-coord-ctx-sheet-overlay"
            aria-label="Cerrar"
            onClick={cerrar}
          />
          <div className="pp-coord-ctx-sheet-panel">
            <header>
              <strong>Contexto del caso</strong>
              <button type="button" onClick={cerrar} aria-label="Cerrar">
                <Icono nombre="cerrar" size={18} />
              </button>
            </header>
            {contenido}
          </div>
        </div>
      )}
    </>
  );
}
