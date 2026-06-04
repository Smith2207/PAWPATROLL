"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGeolocalizacion } from "@/hooks/useGeolocalizacion";
import { buscarLugaresPorTexto } from "@/lib/geo/geocodificar";
import type { UbicacionSeleccionada } from "@/lib/geo/tipos";
import { coordenadasValidas } from "@/lib/geo/tipos";
import { Icono, type NombreIcono } from "@/componentes/ui/Icono";
import { etiquetaVisibleUbicacion, ubicacionConEtiqueta } from "@/lib/geo/etiqueta-ubicacion";

const MapaPawPatrol = dynamic(
  () =>
    import("@/componentes/mapa/MapaPawPatrol").then((m) => ({
      default: m.MapaPawPatrol,
    })),
  { ssr: false, loading: () => <div className="pp-mapa pp-mapa--compacto" /> }
);

type Props = {
  etiqueta: string;
  idInput: string;
  icono: NombreIcono;
  placeholder: string;
  valor?: UbicacionSeleccionada | null;
  onChange?: (ubicacion: UbicacionSeleccionada) => void;
  direccionTexto?: string;
  onDireccionChange?: (texto: string) => void;
};

export function SelectorUbicacionMapa({
  etiqueta,
  idInput,
  icono,
  placeholder,
  valor,
  onChange,
  direccionTexto = "",
  onDireccionChange,
}: Props) {
  const geo = useGeolocalizacion({
    onUbicacion: onChange,
    onDireccionDetectada: onDireccionChange,
  });

  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  const [sugerencias, setSugerencias] = useState<
    { lat: number; lng: number; etiqueta: string }[]
  >([]);
  const [listaAbierta, setListaAbierta] = useState(false);
  const [avisoBusqueda, setAvisoBusqueda] = useState<string | null>(null);
  const omitirBusquedaRef = useRef(false);

  const ubicacionActiva = valor ?? geo.ubicacion;
  const ubicacionLista = coordenadasValidas(ubicacionActiva);

  const aplicarLugar = useCallback(
    (lugar: { lat: number; lng: number; etiqueta: string }) => {
      omitirBusquedaRef.current = true;
      onDireccionChange?.(lugar.etiqueta);
      onChange?.(ubicacionConEtiqueta(lugar, lugar.etiqueta));
      setSugerencias([]);
      setListaAbierta(false);
      setAvisoBusqueda(null);
    },
    [onChange, onDireccionChange]
  );

  useEffect(() => {
    if (omitirBusquedaRef.current) {
      omitirBusquedaRef.current = false;
      return;
    }

    const texto = direccionTexto.trim();
    if (texto.length < 4) {
      setSugerencias([]);
      setBuscandoDireccion(false);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscandoDireccion(true);
      const resultados = await buscarLugaresPorTexto(texto);
      setSugerencias(resultados);
      setBuscandoDireccion(false);
      setListaAbierta(resultados.length > 0);
    }, 550);

    return () => clearTimeout(timer);
  }, [direccionTexto]);

  async function buscarEnMapa() {
    const texto = direccionTexto.trim();
    if (texto.length < 3) return;

    setBuscandoDireccion(true);
    const resultados = await buscarLugaresPorTexto(texto);
    setBuscandoDireccion(false);

    if (resultados.length > 0) {
      aplicarLugar(resultados[0]);
      return;
    }

    setAvisoBusqueda("No encontramos esa dirección. Prueba con otra o marca en el mapa.");
  }

  return (
    <div className="form-group">
      <label>{etiqueta}</label>
      <div className="location-picker">
        <div className="location-picker-top pp-busqueda-direccion">
          <span className="loc-icon">
          <Icono nombre={icono} size={18} />
        </span>
          <input
            id={idInput}
            name={idInput}
            type="text"
            autoComplete="off"
            placeholder={placeholder}
            value={direccionTexto}
            onChange={(e) => {
              setAvisoBusqueda(null);
              geo.setError(null);
              onDireccionChange?.(e.target.value);
            }}
            onFocus={() => sugerencias.length > 0 && setListaAbierta(true)}
            onBlur={() => setTimeout(() => setListaAbierta(false), 180)}
          />
          <button
            type="button"
            className="pp-btn-buscar-direccion"
            disabled={buscandoDireccion || direccionTexto.trim().length < 3}
            onClick={() => void buscarEnMapa()}
            title="Buscar dirección"
          >
            {buscandoDireccion ? (
              "…"
            ) : (
              <Icono nombre="buscar" size={16} />
            )}
          </button>
        </div>

        {listaAbierta && sugerencias.length > 0 && (
          <ul className="pp-sugerencias-direccion" role="listbox">
            {sugerencias.map((s, i) => (
              <li key={`${s.lat}-${s.lng}-${i}`}>
                <button
                  type="button"
                  role="option"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => aplicarLugar(s)}
                >
                  <Icono nombre="ubicacion" size={14} className="pp-icon--btn" />{" "}
                  {s.etiqueta}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div
          className={`pp-ubicacion-estado ${ubicacionLista ? "pp-ubicacion-estado--ok" : ""}`}
        >
          {geo.cargando ? (
            <>
              <Icono nombre="reloj" size={16} />
              Ubicándote en el mapa…
            </>
          ) : ubicacionLista ? (
            <>
              <Icono nombre="checkCirculo" size={16} />
              <strong>{etiquetaVisibleUbicacion(ubicacionActiva)}</strong>
              <span className="pp-ubicacion-estado-hint">
                — el mapa y la dirección van juntos
              </span>
            </>
          ) : (
            <>
              <Icono nombre="ubicacion" size={16} />
              Escribe una dirección y pulsa{" "}
              <Icono nombre="buscar" size={14} className="pp-icon--btn" />
              , el botón del mapa o toca el mapa
            </>
          )}
        </div>

        {(geo.error || avisoBusqueda) && (
          <p className="auth-alerta auth-alerta--error" style={{ marginBottom: "0.5rem" }}>
            {geo.error ?? avisoBusqueda}
          </p>
        )}

        <div className="location-map-preview location-map-preview--real">
          <MapaPawPatrol
            altura="compacto"
            marcadorUsuario={ubicacionLista ? ubicacionActiva : null}
            centrarEnUsuario={ubicacionLista ? ubicacionActiva : undefined}
            onClickMapa={(c) => {
              void geo.marcarEnMapa(c).then((u) => {
                onChange?.(u);
              });
            }}
            mostrarCalor={false}
            mostrarCercos={false}
            mostrarBotonGeolocalizar
            geolocalizando={geo.cargando}
            onGeolocalizar={() => {
              void geo.obtenerUbicacion();
            }}
          />
        </div>
      </div>
    </div>
  );
}
