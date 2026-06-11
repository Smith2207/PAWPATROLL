"use client";



/**
 * [mapa] Mapa: paw patrol.
 */
/**
 * [mapa] Mapa: paw patrol.
 */
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { datosMapaDeUnaMascota } from "@/lib/mapa/filtrar-por-mascota";
import L from "leaflet";
import "leaflet.heat";
import type {
  DatosMapaPublico,
  MarcadorAvistamientoMapa,
  MarcadorPerdidaMapa,
} from "@/actions/mapa";
import type { PrediccionComportamiento } from "@/lib/comportamiento/prediccion";
import {
  configurarIconosLeaflet,
  iconoFoto,
  iconoSvgMapa,
  iconoUbicacionUsuario,
  TAMANO_MARCADOR_FOTO,
} from "@/lib/geo/leaflet-iconos";
import { Icono } from "@/componentes/ui/Icono";
import {
  agruparMarcadoresCercanos,
  centroideGrupo,
} from "@/lib/geo/agrupar-marcadores";
import { distanciaMetros } from "@/lib/geo/distancia";
import { fallbackMarcadorPorTipo } from "@/lib/mascotas/tipos";
import {
  popupGrupoAvistamientos,
  popupPerdida,
  popupPerdidaComunidad,
  popupRefugioProbable,
  popupUbicacionUsuario,
  popupZonaBusqueda,
} from "@/lib/mapa/popups-leaflet";
import {
  CENTRO_MAPA_DEFECTO,
  coordenadasValidas,
  type Coordenadas,
  type UbicacionSeleccionada,
} from "@/lib/geo/tipos";
import { zoomMapaParaPrecision } from "@/lib/geo/precision-gps";
import {
  COLOR_AVISTAMIENTO_SIN_VINCULO,
  mapaEstilosPorMascota,
  type EstiloFamiliaMascota,
} from "@/lib/mapa/colores-cerco";
import {
  agregarCapaCalorSegura,
  contenedorMapaVisible,
  invalidarTamanoMapaSeguro,
} from "@/lib/mapa/leaflet-utilidades";

function observarHastaCapaCalor(
  mapa: L.Map,
  contenedor: HTMLElement | null | undefined,
  puntos: [number, number, number?][],
  onListo: (capa: L.Layer) => void
): () => void {
  const wrap =
    contenedor?.closest(".ficha-publica-mapa-envoltorio") ??
    contenedor?.parentElement ??
    contenedor;
  if (!wrap) return () => {};

  let capa: L.Layer | null = null;
  const intentar = () => {
    if (capa) return true;
    capa = agregarCapaCalorSegura(mapa, contenedor, puntos);
    if (capa) {
      onListo(capa);
      return true;
    }
    return false;
  };

  if (intentar()) return () => {};

  const ro = new ResizeObserver(() => {
    if (intentar()) ro.disconnect();
  });
  ro.observe(wrap);

  const t1 = window.setTimeout(intentar, 120);
  const t2 = window.setTimeout(intentar, 350);

  return () => {
    ro.disconnect();
    window.clearTimeout(t1);
    window.clearTimeout(t2);
    if (capa) {
      try {
        mapa.removeLayer(capa);
      } catch {
        /* ya removida */
      }
    }
  };
}

/** flyTo seguro: omitir si el mapa está oculto (p. ej. wizard con display:none) */
function volarAPuntoSeguro(
  mapa: L.Map,
  contenedor: HTMLElement | null,
  punto: Coordenadas,
  zoom = 17
) {
  if (!coordenadasValidas(punto) || !contenedorMapaVisible(contenedor)) return;
  try {
    invalidarTamanoMapaSeguro(mapa, contenedor);
    mapa.flyTo([punto.lat, punto.lng], zoom, {
      animate: true,
      duration: 0.8,
    });
  } catch {
    /* contenedor sin layout o transición de visibilidad */
  }
}

type Props = {
  datos?: DatosMapaPublico;
  prediccion?: PrediccionComportamiento | null;
  /** Ficha individual: solo esta mascota (cerco, avistamientos y M5 propios) */
  mascotaId?: string;
  nombreMascota?: string;
  className?: string;
  altura?: "compacto" | "hero" | "seccion" | "ficha";
  /** Punto seleccionado (formularios) */
  marcadorUsuario?: UbicacionSeleccionada | null;
  onClickMapa?: (coords: Coordenadas) => void;
  mostrarCalor?: boolean;
  mostrarCercos?: boolean;
  /** Solo pins de pérdida en lat/lng del escape (sin cercos, avistamientos ni calor) */
  vista?: "completa" | "solo-perdidas";
  /** Refugios probables (M5): solo en ficha individual */
  mostrarRefugios?: boolean;
  /** Cerco con color distinto por cada perdida (mapa comunitario) */
  cercoColorPorPerdida?: boolean;
  centrarEnUsuario?: UbicacionSeleccionada | null;
  /** Botón flotante sobre el mapa */
  mostrarBotonGeolocalizar?: boolean;
  geolocalizando?: boolean;
  onGeolocalizar?: () => void;
  /** Etiqueta flotante sobre el mapa (p. ej. conteo de mascotas) */
  etiquetaSuperior?: ReactNode;
};

function calcularCentro(datos: DatosMapaPublico | undefined): Coordenadas {
  const puntos: Coordenadas[] = [];
  datos?.perdidas.forEach((p) => puntos.push({ lat: p.lat, lng: p.lng }));
  datos?.avistamientos.forEach((a) => puntos.push({ lat: a.lat, lng: a.lng }));
  if (puntos.length === 0) return CENTRO_MAPA_DEFECTO;
  const lat = puntos.reduce((s, p) => s + p.lat, 0) / puntos.length;
  const lng = puntos.reduce((s, p) => s + p.lng, 0) / puntos.length;
  return { lat, lng };
}

function agruparAvistamientosPorMascota(
  lista: MarcadorAvistamientoMapa[],
  umbralMetros: number
): MarcadorAvistamientoMapa[][] {
  const porMascota = new Map<string, MarcadorAvistamientoMapa[]>();
  const sinVinculo: MarcadorAvistamientoMapa[] = [];

  for (const av of lista) {
    if (av.mascotaId) {
      const grupo = porMascota.get(av.mascotaId) ?? [];
      grupo.push(av);
      porMascota.set(av.mascotaId, grupo);
    } else {
      sinVinculo.push(av);
    }
  }

  const grupos: MarcadorAvistamientoMapa[][] = [];
  for (const sublista of porMascota.values()) {
    grupos.push(...agruparMarcadoresCercanos(sublista, umbralMetros));
  }
  if (sinVinculo.length > 0) {
    grupos.push(...agruparMarcadoresCercanos(sinVinculo, umbralMetros));
  }
  return grupos;
}

function fotoRepresentativaGrupo(
  grupo: MarcadorAvistamientoMapa[]
): string | null {
  for (const a of grupo) {
    const f = a.fotoAvistamiento ?? a.fotoMascota;
    if (f?.startsWith("data:image/") || f?.startsWith("http")) return f;
  }
  return null;
}

export function MapaPawPatrol({
  datos: datosProp,
  prediccion: prediccionProp,
  mascotaId,
  nombreMascota,
  className = "",
  altura = "seccion",
  marcadorUsuario,
  onClickMapa,
  mostrarCalor = true,
  mostrarCercos = true,
  vista = "completa",
  mostrarRefugios = false,
  cercoColorPorPerdida = false,
  centrarEnUsuario,
  mostrarBotonGeolocalizar = false,
  geolocalizando = false,
  onGeolocalizar,
  etiquetaSuperior,
}: Props) {
  const datos = useMemo(() => {
    if (!datosProp) return undefined;
    if (!mascotaId) return datosProp;
    return datosMapaDeUnaMascota(datosProp, mascotaId);
  }, [datosProp, mascotaId]);

  const prediccion = prediccionProp ?? datos?.prediccion ?? null;
  const esMapaIndividual = Boolean(mascotaId);
  const soloPerdidas = vista === "solo-perdidas";
  const mostrarCalorEfectivo = mostrarCalor && !soloPerdidas;
  const mostrarCercosEfectivo = mostrarCercos && !soloPerdidas;
  const idsPerdidas = datos?.perdidas.map((p) => p.id).join(",") ?? "";

  const coloresPorMascota = useMemo(() => {
    if (!cercoColorPorPerdida || !datos?.perdidas.length) {
      return new Map<string, EstiloFamiliaMascota>();
    }
    return mapaEstilosPorMascota(datos.perdidas.map((p) => p.id));
  }, [cercoColorPorPerdida, idsPerdidas, datos?.perdidas]);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const capasRef = useRef<L.LayerGroup | null>(null);
  const calorRef = useRef<L.Layer | null>(null);
  const usuarioRef = useRef<L.Marker | null>(null);
  const precisionRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor || mapaRef.current) return;

    let cancelado = false;
    let mapa: L.Map | null = null;
    let ro: ResizeObserver | undefined;
    let rafResize = 0;

    const iniciarMapa = () => {
      if (cancelado || mapaRef.current || !contenedorRef.current) return false;
      if (!contenedorMapaVisible(contenedorRef.current)) return false;

      configurarIconosLeaflet();

      const centro = centrarEnUsuario ?? calcularCentro(datos);
      mapa = L.map(contenedorRef.current, {
        scrollWheelZoom: true,
        zoomControl: altura !== "hero",
      }).setView([centro.lat, centro.lng], datos?.perdidas.length ? 13 : 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapa);

      const capas = L.layerGroup().addTo(mapa);
      mapaRef.current = mapa;
      capasRef.current = capas;

      if (onClickMapa) {
        mapa.on("click", (e) => {
          onClickMapa({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      }

      const wrap =
        contenedor.closest(".ficha-publica-mapa-envoltorio") ??
        contenedor.parentElement;
      if (wrap) {
        ro = new ResizeObserver(() => {
          cancelAnimationFrame(rafResize);
          rafResize = requestAnimationFrame(() => {
            if (mapaRef.current) {
              invalidarTamanoMapaSeguro(mapaRef.current, contenedor);
            }
          });
        });
        ro.observe(wrap);
      }

      invalidarTamanoMapaSeguro(mapa, contenedor);
      return true;
    };

    if (!iniciarMapa()) {
      const wrap =
        contenedor.closest(".ficha-publica-mapa-envoltorio") ??
        contenedor.parentElement ??
        contenedor;
      const roInicio = new ResizeObserver(() => {
        if (iniciarMapa()) roInicio.disconnect();
      });
      roInicio.observe(wrap);
      window.setTimeout(() => {
        if (iniciarMapa()) roInicio.disconnect();
      }, 80);
      window.setTimeout(() => {
        if (iniciarMapa()) roInicio.disconnect();
      }, 250);

      return () => {
        cancelado = true;
        roInicio.disconnect();
        cancelAnimationFrame(rafResize);
        ro?.disconnect();
        if (mapaRef.current) {
          mapaRef.current.remove();
          mapaRef.current = null;
          capasRef.current = null;
          calorRef.current = null;
          usuarioRef.current = null;
          precisionRef.current = null;
        }
      };
    }

    return () => {
      cancelado = true;
      cancelAnimationFrame(rafResize);
      ro?.disconnect();
      mapa?.remove();
      mapaRef.current = null;
      capasRef.current = null;
      calorRef.current = null;
      usuarioRef.current = null;
      precisionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const mapa = mapaRef.current;
    const capas = capasRef.current;
    if (!mapa || !capas) return;

    const cleanups: (() => void)[] = [];

    capas.clearLayers();
    if (calorRef.current) {
      mapa.removeLayer(calorRef.current);
      calorRef.current = null;
    }

    if (datos && mostrarCalorEfectivo && datos.puntosCalor.length > 0) {
      const contenedor = contenedorRef.current;
      const puntos = datos.puntosCalor;
      const capa = agregarCapaCalorSegura(mapa, contenedor, puntos);
      if (capa) {
        calorRef.current = capa;
      } else {
        cleanups.push(
          observarHastaCapaCalor(mapa, contenedor, puntos, (c) => {
            calorRef.current = c;
          })
        );
      }
    }

    if (prediccion?.centro && mostrarCercosEfectivo) {
      L.circle([prediccion.centro.lat, prediccion.centro.lng], {
        radius: prediccion.radioBaseMetros,
        color: "#94a3b8",
        fillColor: "#cbd5e1",
        fillOpacity: 0.06,
        weight: 1,
        dashArray: "4 6",
      }).addTo(capas);
    }

    if (datos) {
      datos.perdidas.forEach((p) => {
        const estiloFamilia = cercoColorPorPerdida
          ? (coloresPorMascota.get(p.id) ?? {
              color: "#ea580c",
              fillColor: "#fb923c",
            })
          : { color: "#f97316", fillColor: "#fb923c" };

        if (mostrarCercosEfectivo) {
          const radio =
            prediccion?.radioActualMetros && datos.perdidas.length === 1
              ? prediccion.radioActualMetros
              : p.radioMetros;

          const radioSoloTiempo =
            p.prediccion?.cerco.radioTemporalMetros ?? radio;
          const muestraCercoTiempo =
            p.prediccion &&
            !cercoColorPorPerdida &&
            Math.abs(radio - radioSoloTiempo) > radioSoloTiempo * 0.08;

          if (muestraCercoTiempo) {
            L.circle([p.lat, p.lng], {
              radius: Math.min(radio * 0.5, radioSoloTiempo),
              color: "#94a3b8",
              fillColor: "#cbd5e1",
              fillOpacity: 0.05,
              weight: 1,
              dashArray: "4 8",
            }).addTo(capas);
          }

          const centroCercoLat = p.cercoLat ?? p.lat;
          const centroCercoLng = p.cercoLng ?? p.lng;
          const desplazado =
            Math.abs(centroCercoLat - p.lat) > 0.00001 ||
            Math.abs(centroCercoLng - p.lng) > 0.00001;

          L.circle([centroCercoLat, centroCercoLng], {
            radius: radio,
            color: estiloFamilia.color,
            fillColor: estiloFamilia.fillColor,
            fillOpacity: 0.14,
            weight: 2,
            dashArray: "6 4",
          })
            .bindPopup(popupZonaBusqueda(p.nombre, radio, desplazado))
            .addTo(capas);

          if (p.rutaAvistamientos.length > 0) {
            const ruta: L.LatLngExpression[] = [
              [p.lat, p.lng],
              ...p.rutaAvistamientos.map(
                (pt) => [pt.lat, pt.lng] as L.LatLngExpression
              ),
            ];
            L.polyline(ruta, {
              color: estiloFamilia.color,
              weight: 3,
              opacity: 0.8,
              dashArray: "6 8",
            }).addTo(capas);
          }
        }

        L.marker([p.lat, p.lng], {
          icon: iconoFoto(p.fotoPrincipal, {
            clase: "pp-marcador--perdida",
            fallbackContenido: fallbackMarcadorPorTipo(p.tipo),
            tamano: TAMANO_MARCADOR_FOTO,
            colorFamilia: cercoColorPorPerdida
              ? estiloFamilia.color
              : undefined,
          }),
          zIndexOffset: 1000,
        })
          .bindPopup(
            soloPerdidas && !esMapaIndividual
              ? popupPerdidaComunidad(p)
              : popupPerdida(p, esMapaIndividual)
          )
          .addTo(capas);
      });
    }

    const refugios: NonNullable<typeof prediccion>["zonasRefugio"] =
      prediccion?.zonasRefugio ??
      datos?.perdidas.flatMap((p) => p.prediccion?.zonasRefugio ?? []) ??
      [];

    if (mostrarRefugios && !soloPerdidas && refugios.length > 0) {
      for (const z of refugios) {
        L.circle([z.lat, z.lng], {
          radius: 90,
          color: "#6366f1",
          fillColor: "#818cf8",
          fillOpacity: 0.2,
          weight: 1,
        })
          .bindPopup(popupRefugioProbable(z.etiqueta, z.probabilidad))
          .addTo(capas);

        L.marker([z.lat, z.lng], {
          icon: iconoSvgMapa("casa", "pp-marcador--refugio"),
        }).addTo(capas);
      }
    }

    if (datos && !soloPerdidas) {
      const UMBRAL_MISMO_PUNTO_M = 45;

      const avistamientosEnMapa = datos.avistamientos.filter((a) => {
        const perdidaVinculada = a.mascotaId
          ? datos.perdidas.find((p) => p.id === a.mascotaId)
          : undefined;
        if (!perdidaVinculada) return true;
        return (
          distanciaMetros(
            perdidaVinculada.lat,
            perdidaVinculada.lng,
            a.lat,
            a.lng
          ) >= UMBRAL_MISMO_PUNTO_M
        );
      });

      const gruposAvistamiento = cercoColorPorPerdida
        ? agruparAvistamientosPorMascota(
            avistamientosEnMapa,
            UMBRAL_MISMO_PUNTO_M
          )
        : agruparMarcadoresCercanos(
            avistamientosEnMapa,
            UMBRAL_MISMO_PUNTO_M
          );

      for (const grupo of gruposAvistamiento) {
        const centro = centroideGrupo(grupo);
        const fotoPin = fotoRepresentativaGrupo(grupo);
        const numerosReporte = [...grupo]
          .map((a) => a.numeroReporte)
          .sort((a, b) => a - b);

        const mascotaIdGrupo = grupo[0]?.mascotaId;
        const colorAv =
          mascotaIdGrupo && coloresPorMascota.has(mascotaIdGrupo)
            ? coloresPorMascota.get(mascotaIdGrupo)!.color
            : cercoColorPorPerdida
              ? COLOR_AVISTAMIENTO_SIN_VINCULO
              : undefined;

        const tipoAv =
          grupo[0]?.mascotaId != null
            ? (datos?.perdidas.find((p) => p.id === grupo[0]!.mascotaId)?.tipo ??
              "")
            : "";

        const icon = iconoFoto(fotoPin, {
          clase: "pp-marcador--avistamiento",
          fallbackContenido: fallbackMarcadorPorTipo(tipoAv),
          badges: numerosReporte,
          tamano: TAMANO_MARCADOR_FOTO,
          colorFamilia: colorAv,
        });

        L.marker([centro.lat, centro.lng], { icon, zIndexOffset: 500 })
          .bindPopup(popupGrupoAvistamientos(grupo))
          .addTo(capas);
      }
    }

    const bounds: [number, number][] = [];
    datos?.perdidas.forEach((p) => bounds.push([p.lat, p.lng]));
    if (!soloPerdidas) {
      datos?.avistamientos.forEach((a) => bounds.push([a.lat, a.lng]));
    }

    if (bounds.length > 1) {
      try {
        if (contenedorMapaVisible(contenedorRef.current)) {
          mapa.fitBounds(L.latLngBounds(bounds), {
            padding: [40, 40],
            maxZoom: 14,
          });
        }
      } catch {
        /* contenedor sin layout */
      }
    } else if (bounds.length === 1) {
      try {
        mapa.setView(bounds[0], 14);
      } catch {
        /* contenedor sin layout */
      }
    }

    if (altura === "ficha") {
      const contenedor = contenedorRef.current;
      const id = window.setTimeout(() => {
        invalidarTamanoMapaSeguro(mapa, contenedor);
        if (
          !calorRef.current &&
          datos &&
          mostrarCalorEfectivo &&
          datos.puntosCalor.length > 0
        ) {
          const capa = agregarCapaCalorSegura(
            mapa,
            contenedor,
            datos.puntosCalor
          );
          if (capa) calorRef.current = capa;
        }
      }, 80);
      cleanups.push(() => window.clearTimeout(id));
    }

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [
    datos,
    prediccion,
    mostrarCalorEfectivo,
    mostrarCercosEfectivo,
    soloPerdidas,
    mostrarRefugios,
    cercoColorPorPerdida,
    coloresPorMascota,
    esMapaIndividual,
    altura,
  ]);

  useEffect(() => {
    const mapa = mapaRef.current;
    const contenedor = contenedorRef.current;
    if (!mapa) return;

    if (usuarioRef.current) {
      usuarioRef.current.remove();
      usuarioRef.current = null;
    }
    if (precisionRef.current) {
      precisionRef.current.remove();
      precisionRef.current = null;
    }

    const punto: UbicacionSeleccionada | null | undefined =
      marcadorUsuario ?? centrarEnUsuario;
    if (!punto || !coordenadasValidas(punto)) return;

    const precision = punto.precisionMetros;
    if (precision && precision > 0 && precision < 500) {
      try {
        precisionRef.current = L.circle([punto.lat, punto.lng], {
          radius: precision,
          color: "#4285F4",
          fillColor: "#4285F4",
          fillOpacity: 0.15,
          weight: 1,
        }).addTo(mapa);
      } catch {
        /* mapa sin layout */
      }
    }

    const etiquetaPopup = punto.etiqueta?.trim() || "Tu ubicación";
    try {
      usuarioRef.current = L.marker([punto.lat, punto.lng], {
        icon: iconoUbicacionUsuario(),
        zIndexOffset: 1000,
      })
        .bindPopup(popupUbicacionUsuario(etiquetaPopup))
        .addTo(mapa);
    } catch {
      /* mapa sin layout */
    }

    volarAPuntoSeguro(
      mapa,
      contenedor,
      punto,
      zoomMapaParaPrecision(punto.precisionMetros)
    );

    const wrap = contenedor?.parentElement;
    let ro: ResizeObserver | undefined;
    let timer = 0;

    const reintentarVuelo = () => {
      volarAPuntoSeguro(
        mapa,
        contenedor,
        punto,
        zoomMapaParaPrecision(punto.precisionMetros)
      );
    };

    if (wrap) {
      ro = new ResizeObserver(() => reintentarVuelo());
      ro.observe(wrap);
    }

    timer = window.setTimeout(reintentarVuelo, 180);

    return () => {
      ro?.disconnect();
      window.clearTimeout(timer);
    };
  }, [marcadorUsuario, centrarEnUsuario]);

  return (
    <div
      className={`pp-mapa-wrap ${className}`.trim()}
      style={altura === "hero" ? { height: 210 } : undefined}
    >
      <div
        ref={contenedorRef}
        className={`pp-mapa pp-mapa--${altura}`}
        role="application"
        aria-label={
          nombreMascota
            ? `Mapa de búsqueda de ${nombreMascota}`
            : "Mapa interactivo PawPatrol"
        }
      />
      {etiquetaSuperior ? (
        <div className="pp-mapa-etiqueta-superior" aria-live="polite">
          {etiquetaSuperior}
        </div>
      ) : null}
      {mostrarBotonGeolocalizar && onGeolocalizar && (
        <button
          type="button"
          className="pp-mapa-btn-geo"
          disabled={geolocalizando}
          onClick={(e) => {
            e.stopPropagation();
            onGeolocalizar();
          }}
          aria-label="Ubicarme en el mapa"
        >
          {geolocalizando ? (
            <Icono nombre="reloj" size={18} />
          ) : (
            <Icono nombre="objetivo" size={18} />
          )}
          <span>{geolocalizando ? "Ubicando…" : "Ubicarme"}</span>
        </button>
      )}
    </div>
  );
}
