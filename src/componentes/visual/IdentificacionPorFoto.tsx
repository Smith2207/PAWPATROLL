"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Icono } from "@/componentes/ui/Icono";
import { useModales } from "@/contexto/ContextoModales";
import type {
  CoincidenciaVisual,
  FiltrosBusquedaVisual,
} from "@/lib/visual/tipos";
import {
  extraerCaracteristicasDesdeDataUrl,
  type CaracteristicasVisuales,
} from "@/lib/visual/extraer-caracteristicas";
import {
  nivelParecido,
  textoParecido,
} from "@/lib/visual/etiquetas-parecido";
import {
  ACCEPT_INPUT_IMAGEN,
  MENSAJE_IMAGEN_ILEGIBLE,
  validarArchivoImagen,
} from "@/lib/imagen/validar-archivo";

const MAX_BYTES_BUSQUEDA = 4 * 1024 * 1024;

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
  const { abrirModal } = useModales();
  const inputGaleriaRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coincidencias, setCoincidencias] = useState<CoincidenciaVisual[]>([]);
  const [indiceVacio, setIndiceVacio] = useState(false);
  const [busquedaLista, setBusquedaLista] = useState(false);

  function reiniciar() {
    setPreview(null);
    setCoincidencias([]);
    setError(null);
    setIndiceVacio(false);
    setBusquedaLista(false);
    if (inputGaleriaRef.current) inputGaleriaRef.current.value = "";
  }

  async function procesarImagen(dataUrl: string) {
    setPreview(dataUrl);
    setCargando(true);
    setError(null);
    setCoincidencias([]);
    setIndiceVacio(false);
    setBusquedaLista(false);

    try {
      const attrs = await extraerCaracteristicasDesdeDataUrl(dataUrl);
      onCaracteristicas?.(attrs);
    } catch {
      /* autocompletado opcional */
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
  }

  async function onArchivo(file: File | undefined) {
    if (inputGaleriaRef.current) inputGaleriaRef.current.value = "";
    if (!file) return;

    const validacion = validarArchivoImagen(file, {
      maxBytes: MAX_BYTES_BUSQUEDA,
    });
    if (!validacion.ok) {
      setError(validacion.error);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setError(MENSAJE_IMAGEN_ILEGIBLE);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      void procesarImagen(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div
      className={`foto-ia${compacto ? " foto-ia--compacto" : ""}`}
      aria-busy={cargando}
    >
      {!compacto && (
        <p className="foto-ia-intro">
          Subí una foto y buscamos mascotas <strong>perdidas</strong> que se
          parezcan.
        </p>
      )}

      {!preview ? (
        <>
          <input
            ref={inputGaleriaRef}
            type="file"
            accept={ACCEPT_INPUT_IMAGEN}
            className="foto-ia-input-oculto"
            onChange={(e) => onArchivo(e.target.files?.[0])}
          />
          <button
            type="button"
            className="foto-ia-zona"
            onClick={() => !cargando && inputGaleriaRef.current?.click()}
            disabled={cargando}
          >
            <span className="foto-ia-zona-icono">
              <Icono nombre="imagen" size={32} />
            </span>
            <span className="foto-ia-zona-titulo">Elegir de galería</span>
            <span className="foto-ia-zona-sub">
              {compacto
                ? "Galería o cámara · máx. 4 MB"
                : "JPG, PNG o WebP · galería o cámara · máx. 4 MB"}
            </span>
          </button>
        </>
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
                onClick={() => inputGaleriaRef.current?.click()}
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

      {error && (
        <div className="foto-ia-alerta foto-ia-alerta--error" role="alert">
          {error}
        </div>
      )}

      {indiceVacio && busquedaLista && !error && (
        <div className="foto-ia-alerta foto-ia-alerta--info">
          <p className="foto-ia-alerta-texto">
            Aún no hay mascotas perdidas registradas con foto. Cuando alguien
            reporte una pérdida, podrás buscar aquí.
          </p>
          <button
            type="button"
            className="foto-ia-btn-usar foto-ia-btn-indice-vacio"
            onClick={() => abrirModal("report")}
          >
            Reportar mascota perdida
          </button>
        </div>
      )}

      {busquedaLista && coincidencias.length > 0 && (
        <div className="foto-ia-resultados">
          <div className="foto-ia-resultados-cabecera">
            <span className="foto-ia-resultados-titulo">
              Se parece a estas mascotas reportadas
            </span>
            <span className="foto-ia-resultados-cantidad">
              {coincidencias.length}
            </span>
          </div>
          <p className="foto-ia-disclaimer">
            Orientación automática por foto. Verifica siempre con el dueño antes
            de afirmar que es la misma mascota.
          </p>
          <ul className="foto-ia-lista">
            {coincidencias.map((c, i) => {
              const seleccionada = mascotaSeleccionadaId === c.mascotaId;
              const nivel = nivelParecido(c.similitud);
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
                      <Icono nombre="huella" size={24} />
                    </div>
                  )}
                  <div className="foto-ia-item-cuerpo">
                    <div className="foto-ia-item-fila">
                      <strong>{c.nombre}</strong>
                      {i === 0 && (
                        <span className="foto-ia-badge-mejor">Más parecida</span>
                      )}
                    </div>
                    {c.descripcionAi && (
                      <p className="foto-ia-descripcion-ai">{c.descripcionAi}</p>
                    )}
                    <div className="foto-ia-barra-meta">
                      <span>{textoParecido(c.similitud)}</span>
                    </div>
                    <div
                      className={`foto-ia-barra foto-ia-barra--${nivel}`}
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
                          {seleccionada ? (
                            <>
                              <Icono nombre="check" size={14} className="pp-icon--btn" />{" "}
                              Seleccionada
                            </>
                          ) : (
                            "Usar en avistamiento"
                          )}
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
