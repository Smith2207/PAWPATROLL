"use client";

import { buscarCiudadesDesdeApi, type UbicacionPeru } from "@/lib/geo/ciudades";
import { useEffect, useId, useRef, useState } from "react";

type Props = {
  id?: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  required?: boolean;
  ayuda?: string;
};

export function CampoCiudad({
  id: idProp,
  label,
  value,
  onChange,
  placeholder = "Distrito, provincia o departamento…",
  required = false,
  ayuda,
}: Props) {
  const idBase = useId();
  const inputId = idProp ?? `ciudad-${idBase}`;
  const listaId = `${inputId}-lista`;

  const contenedorRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const solicitudRef = useRef(0);

  const [abierto, setAbierto] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(-1);
  const [sugerencias, setSugerencias] = useState<UbicacionPeru[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errorApi, setErrorApi] = useState<string | null>(null);

  const termino = value.trim();
  const mostrarLista =
    abierto && termino.length >= 2 && (sugerencias.length > 0 || cargando);

  useEffect(() => {
    if (!abierto) return;

    function cerrarSiFuera(e: MouseEvent) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(e.target as Node)
      ) {
        setAbierto(false);
        setIndiceActivo(-1);
      }
    }

    document.addEventListener("mousedown", cerrarSiFuera);
    return () => document.removeEventListener("mousedown", cerrarSiFuera);
  }, [abierto]);

  useEffect(() => {
    queueMicrotask(() => setIndiceActivo(-1));

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (termino.length < 2) {
      queueMicrotask(() => {
        setSugerencias([]);
        setCargando(false);
        setErrorApi(null);
      });
      return;
    }

    queueMicrotask(() => {
      setCargando(true);
      setErrorApi(null);
    });

    const solicitud = ++solicitudRef.current;

    debounceRef.current = setTimeout(() => {
      buscarCiudadesDesdeApi(termino, 12)
        .then((resultados) => {
          if (solicitud !== solicitudRef.current) return;
          setSugerencias(resultados);
          setCargando(false);
        })
        .catch(() => {
          if (solicitud !== solicitudRef.current) return;
          setSugerencias([]);
          setCargando(false);
          setErrorApi("No se pudo buscar. Intenta de nuevo.");
        });
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [termino]);

  function elegir(ubicacion: UbicacionPeru) {
    onChange(ubicacion.etiqueta);
    setAbierto(false);
    setIndiceActivo(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!mostrarLista || sugerencias.length === 0) {
      if (e.key === "ArrowDown" && sugerencias.length > 0) {
        setAbierto(true);
        setIndiceActivo(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceActivo((i) => (i + 1) % sugerencias.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceActivo((i) =>
        i <= 0 ? sugerencias.length - 1 : i - 1
      );
    } else if (e.key === "Enter" && indiceActivo >= 0) {
      e.preventDefault();
      const ubicacion = sugerencias[indiceActivo];
      if (ubicacion) elegir(ubicacion);
    } else if (e.key === "Escape") {
      setAbierto(false);
      setIndiceActivo(-1);
    }
  }

  return (
    <div className="form-group campo-ciudad" ref={contenedorRef}>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="text"
        required={required}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={mostrarLista}
        aria-controls={mostrarLista ? listaId : undefined}
        aria-autocomplete="list"
        aria-busy={cargando}
        aria-activedescendant={
          indiceActivo >= 0 ? `${inputId}-opcion-${indiceActivo}` : undefined
        }
      />
      {mostrarLista && (
        <ul id={listaId} className="campo-ciudad-lista" role="listbox">
          {cargando && sugerencias.length === 0 && (
            <li className="campo-ciudad-estado" role="status">
              Buscando…
            </li>
          )}
          {sugerencias.map((ubicacion, i) => (
            <li
              key={`${ubicacion.ubigeo}-${ubicacion.etiqueta}`}
              id={`${inputId}-opcion-${i}`}
              role="option"
              aria-selected={i === indiceActivo}
              className={
                i === indiceActivo ? "campo-ciudad-opcion--activa" : ""
              }
              onMouseDown={(e) => {
                e.preventDefault();
                elegir(ubicacion);
              }}
              onMouseEnter={() => setIndiceActivo(i)}
            >
              <span className="campo-ciudad-distrito">{ubicacion.distrito}</span>
              <span className="campo-ciudad-ruta">
                {ubicacion.departamento} · {ubicacion.provincia}
              </span>
            </li>
          ))}
        </ul>
      )}
      {errorApi && (
        <p className="perfil-campo-ayuda campo-ciudad-error" role="alert">
          {errorApi}
        </p>
      )}
      {ayuda && !errorApi && (
        <p className="perfil-campo-ayuda">{ayuda}</p>
      )}
    </div>
  );
}
