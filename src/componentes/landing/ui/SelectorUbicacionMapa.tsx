"use client";



/**
 * [landing] Componente React: selector ubicacion mapa.
 */
/**
 * [landing] Componente React: selector ubicacion mapa.
 */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGeolocalizacion } from "@/hooks/useGeolocalizacion";
import { useSolicitudUbicacion } from "@/hooks/useSolicitudUbicacion";
import {
  buscarLugaresPorTexto,
  resolverLugarPorPlaceId,
  type ResultadoBusquedaLugar,
} from "@/lib/geo/geocodificar";
import {
  etiquetaCompletaLugar,
  lugarBusquedaConCoordenadas,
} from "@/lib/geo/lugares";
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

  const { solicitarUbicacion, dialogoPermiso } = useSolicitudUbicacion({
    obtenerUbicacion: geo.obtenerUbicacion,
  });

  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  const [sugerencias, setSugerencias] = useState<ResultadoBusquedaLugar[]>([]);
  const [listaAbierta, setListaAbierta] = useState(false);
  const [avisoBusqueda, setAvisoBusqueda] = useState<string | null>(null);
  const omitirBusquedaRef = useRef(false);

  const ubicacionActiva = valor ?? geo.ubicacion;
  const ubicacionLista = coordenadasValidas(ubicacionActiva);
  const ubicando = geo.cargando;

  const confirmarLugar = useCallback(
    (lugar: ResultadoBusquedaLugar & { lat: number; lng: number }) => {
      omitirBusquedaRef.current = true;
      const texto = etiquetaCompletaLugar(lugar);
      onDireccionChange?.(texto);
      onChange?.(ubicacionConEtiqueta(lugar, texto));
      setSugerencias([]);
      setListaAbierta(false);
      setAvisoBusqueda(null);
    },
    [onChange, onDireccionChange]
  );

  const aplicarLugar = useCallback(
    async (lugar: ResultadoBusquedaLugar) => {
      setBuscandoDireccion(true);
      setAvisoBusqueda(null);

      let resuelto: ResultadoBusquedaLugar = lugar;
      if (!lugarBusquedaConCoordenadas(lugar) && lugar.placeId) {
        const coords = await resolverLugarPorPlaceId(lugar.placeId, {
          etiqueta: lugar.etiqueta,
          subtitulo: lugar.subtitulo,
        });
        if (!coords) {
          setAvisoBusqueda("No pudimos ubicar ese lugar. Prueba otra opción.");
          setBuscandoDireccion(false);
          return;
        }
        resuelto = coords;
      }

      if (!lugarBusquedaConCoordenadas(resuelto)) {
        setBuscandoDireccion(false);
        return;
      }

      confirmarLugar(resuelto);
      setBuscandoDireccion(false);
    },
    [confirmarLugar]
  );

  useEffect(() => {
    if (omitirBusquedaRef.current) {
      omitirBusquedaRef.current = false;
      return;
    }

    const texto = direccionTexto.trim();
    if (texto.length < 4) {
      queueMicrotask(() => {
        setSugerencias([]);
        setBuscandoDireccion(false);
      });
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
      await aplicarLugar(resultados[0]);
      return;
    }

    setAvisoBusqueda("No encontramos esa dirección. Prueba con otra o marca en el mapa.");
  }

  function pedirUbicacion() {
    geo.setError(null);
    void solicitarUbicacion();
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
            aria-label="Buscar dirección"
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
              <li key={s.placeId ?? `${s.lat ?? "x"}-${s.lng ?? "y"}-${i}`}>
                <button
                  type="button"
                  role="option"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void aplicarLugar(s)}
                >
                  <Icono nombre="ubicacion" size={14} className="pp-icon--btn" />
                  <span className="pp-sugerencia-direccion-texto">
                    <span className="pp-sugerencia-direccion-principal">
                      {s.etiqueta}
                    </span>
                    {s.subtitulo ? (
                      <span className="pp-sugerencia-direccion-secundaria">
                        {s.subtitulo}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div
          className={`pp-ubicacion-estado ${ubicacionLista ? "pp-ubicacion-estado--ok" : ""}`}
        >
          {ubicando ? (
            <>
              <Icono nombre="reloj" size={16} />
              Obteniendo GPS…
            </>
          ) : ubicacionLista ? (
            <>
              <Icono nombre="checkCirculo" size={16} />
              <strong>{etiquetaVisibleUbicacion(ubicacionActiva)}</strong>
              <span className="pp-ubicacion-estado-hint">
                — mapa y dirección sincronizados
              </span>
            </>
          ) : (
            <>
              <Icono nombre="ubicacion" size={16} />
              Pulsa <strong>Ubicarme</strong> en el mapa, busca una dirección o toca el mapa
            </>
          )}
        </div>

        {(geo.error || avisoBusqueda) && (
          <p className="auth-alerta auth-alerta--error pp-ubicacion-alerta">
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
            geolocalizando={ubicando}
            onGeolocalizar={pedirUbicacion}
          />
        </div>
      </div>

      {dialogoPermiso}
    </div>
  );
}
