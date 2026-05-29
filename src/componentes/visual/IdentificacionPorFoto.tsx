"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type {
  CoincidenciaVisual,
  FiltrosBusquedaVisual,
} from "@/lib/visual/tipos";
import {
  extraerCaracteristicasDesdeDataUrl,
  type CaracteristicasVisuales,
} from "@/lib/visual/extraer-caracteristicas";

type Props = {
  onElegir?: (c: CoincidenciaVisual) => void;
  compacto?: boolean;
  mascotaSeleccionadaId?: string;
  /** Tipo/color/ubicación del avistamiento para re-ranking */
  filtros?: FiltrosBusquedaVisual;
  onCaracteristicas?: (c: CaracteristicasVisuales) => void;
};

export function IdentificacionPorFoto({
  onElegir,
  compacto,
  mascotaSeleccionadaId,
  filtros,
  onCaracteristicas,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coincidencias, setCoincidencias] = useState<CoincidenciaVisual[]>([]);
  const [indiceVacio, setIndiceVacio] = useState(false);
  const [busquedaLista, setBusquedaLista] = useState(false);
  const [caracteristicas, setCaracteristicas] =
    useState<CaracteristicasVisuales | null>(null);

  function elegirArchivo() {
    if (!cargando) inputRef.current?.click();
  }

  function reiniciar() {
    setPreview(null);
    setCoincidencias([]);
    setError(null);
    setIndiceVacio(false);
    setBusquedaLista(false);
    setCaracteristicas(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onArchivo(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) {
      setError("Selecciona una imagen (JPG, PNG o WebP).");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("Máximo 4 MB por foto.");
      return;
    }

    setError(null);
    setCoincidencias([]);
    setIndiceVacio(false);
    setBusquedaLista(false);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setCargando(true);

      try {
        const attrs = await extraerCaracteristicasDesdeDataUrl(dataUrl);
        setCaracteristicas(attrs);
        onCaracteristicas?.(attrs);
      } catch {
        setCaracteristicas(null);
      }

      try {
        const res = await fetch("/api/ia/buscar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imagen: dataUrl, ...filtros }),
        });
        const data = await res.json();
        if (!data.ok) {
          setError(data.error ?? "No se pudo analizar la foto.");
          return;
        }
        setIndiceVacio(Boolean(data.indiceVacio));
        setCoincidencias(data.coincidencias ?? []);
        setBusquedaLista(true);
        if (data.error && data.indiceVacio) {
          setError(data.error);
        } else if (!data.coincidencias?.length && !data.indiceVacio) {
          setError(
            "No encontramos coincidencias claras. Prueba otra foto o un ángulo más cercano."
          );
        }
      } catch {
        setError("Error de red. Comprueba que el servidor esté en marcha.");
      } finally {
        setCargando(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div
      className={`foto-ia${compacto ? " foto-ia--compacto" : ""}`}
      aria-busy={cargando}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="foto-ia-input-oculto"
        onChange={(e) => onArchivo(e.target.files?.[0])}
      />

      {!compacto && (
        <p className="foto-ia-intro">
          Subí una foto y la comparamos con las mascotas <strong>perdidas</strong>{" "}
          registradas en PawPatrol.
        </p>
      )}

      {!preview ? (
        <button
          type="button"
          className="foto-ia-zona"
          onClick={elegirArchivo}
          disabled={cargando}
        >
          <span className="foto-ia-zona-icono" aria-hidden>
            📷
          </span>
          <span className="foto-ia-zona-titulo">Subir o tomar foto</span>
          <span className="foto-ia-zona-sub">
            {compacto
              ? "Buscamos la mascota perdida más parecida"
              : "JPG, PNG o WebP · máximo 4 MB"}
          </span>
        </button>
      ) : (
        <div className="foto-ia-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Foto para identificar" />
          {cargando && (
            <div className="foto-ia-preview-overlay" role="status">
              <span className="foto-ia-spinner" aria-hidden />
              <span className="foto-ia-overlay-texto">
                Buscando similitudes…
              </span>
              <span className="foto-ia-overlay-hint">
                Puede tardar unos segundos
              </span>
            </div>
          )}
          {!cargando && (
            <div className="foto-ia-preview-acciones">
              <button
                type="button"
                className="foto-ia-btn-secundario"
                onClick={elegirArchivo}
              >
                Cambiar foto
              </button>
              <button
                type="button"
                className="foto-ia-btn-secundario foto-ia-btn-secundario--ghost"
                onClick={reiniciar}
              >
                Quitar
              </button>
            </div>
          )}
        </div>
      )}

      {caracteristicas && (
        <div className="foto-ia-caracteristicas" role="status">
          <strong>Análisis visual (M3)</strong>
          <ul>
            <li>
              Color predominante: <em>{caracteristicas.colorPredominante}</em>
            </li>
            <li>Tamaño en foto: {caracteristicas.tamanoEstimado}</li>
            <li>{caracteristicas.patrones[0]}</li>
          </ul>
        </div>
      )}

      {error && (
        <div className="foto-ia-alerta foto-ia-alerta--error" role="alert">
          {error}
        </div>
      )}

      {indiceVacio && busquedaLista && !error && (
        <div className="foto-ia-alerta foto-ia-alerta--info">
          Aún no hay mascotas perdidas indexadas con foto. Cuando alguien reporte
          una pérdida, podrás buscar aquí.
        </div>
      )}

      {busquedaLista && coincidencias.length > 0 && (
        <div className="foto-ia-resultados">
          <div className="foto-ia-resultados-cabecera">
            <span className="foto-ia-resultados-titulo">
              Coincidencias encontradas
            </span>
            <span className="foto-ia-resultados-cantidad">
              {coincidencias.length}
            </span>
          </div>
          <ul className="foto-ia-lista">
            {coincidencias.map((c, i) => {
              const seleccionada = mascotaSeleccionadaId === c.mascotaId;
              return (
                <li
                  key={c.mascotaId}
                  className={`foto-ia-item${seleccionada ? " foto-ia-item--activa" : ""}`}
                >
                  {c.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.fotoUrl}
                      alt=""
                      className="foto-ia-item-foto"
                    />
                  ) : (
                    <div className="foto-ia-item-foto foto-ia-item-foto--vacía">
                      🐾
                    </div>
                  )}
                  <div className="foto-ia-item-cuerpo">
                    <div className="foto-ia-item-fila">
                      <strong>{c.nombre}</strong>
                      {i === 0 && (
                        <span className="foto-ia-badge-mejor">Mejor match</span>
                      )}
                    </div>
                    <div className="foto-ia-barra-meta">
                      <span>Similitud visual</span>
                      <span className="foto-ia-porcentaje">{c.similitud}%</span>
                    </div>
                    <div
                      className="foto-ia-barra"
                      role="presentation"
                      aria-hidden
                    >
                      <div
                        className="foto-ia-barra-fill"
                        style={{ width: `${c.similitud}%` }}
                      />
                    </div>
                    <div className="foto-ia-item-acciones">
                      {onElegir ? (
                        <button
                          type="button"
                          className={`foto-ia-btn-usar${seleccionada ? " foto-ia-btn-usar--activo" : ""}`}
                          onClick={() => onElegir(c)}
                        >
                          {seleccionada
                            ? "✓ Seleccionada"
                            : "Usar en avistamiento"}
                        </button>
                      ) : null}
                      <Link
                        href={`/mascota/${c.slug}`}
                        className="foto-ia-link-ficha"
                        target="_blank"
                      >
                        Ver ficha
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
