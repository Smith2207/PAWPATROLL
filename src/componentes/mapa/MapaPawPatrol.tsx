"use client";

import { useEffect, useMemo, useRef } from "react";
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
  iconoHtml,
  iconoUbicacionUsuario,
  TAMANO_MARCADOR_FOTO,
} from "@/lib/geo/leaflet-iconos";
import {
  agruparMarcadoresCercanos,
  centroideGrupo,
} from "@/lib/geo/agrupar-marcadores";
import { distanciaMetros } from "@/lib/geo/distancia";
import { emojiPorTipo } from "@/lib/mascotas/tipos";
import { pareceCoordenadas } from "@/lib/geo/etiqueta-ubicacion";
import {
  CENTRO_MAPA_DEFECTO,
  coordenadasValidas,
  type Coordenadas,
  type UbicacionSeleccionada,
} from "@/lib/geo/tipos";
import {
  COLOR_AVISTAMIENTO_SIN_VINCULO,
  mapaEstilosPorMascota,
  type EstiloFamiliaMascota,
} from "@/lib/mapa/colores-cerco";

function textoDireccion(direccion: string | null): string {
  if (!direccion || pareceCoordenadas(direccion)) return "Zona reportada";
  return direccion;
}

/** Evita IndexSizeError cuando Leaflet redibuja con contenedor aún en 0×0 */
function invalidarTamanoMapaSeguro(mapa: L.Map, contenedor?: HTMLElement | null) {
  const el = contenedor ?? mapa.getContainer();
  if (!el?.isConnected) return;
  const { width, height } = el.getBoundingClientRect();
  if (width < 1 || height < 1) return;
  try {
    mapa.invalidateSize();
  } catch {
    /* contenedor oculto o sin layout */
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

function miniaturaPopup(foto: string | null, nombre: string): string {
  if (!foto?.startsWith("data:image/") && !foto?.startsWith("http")) {
    return "";
  }
  const src = foto.replace(/"/g, "&quot;");
  return `<div class="pp-popup-foto"><img src="${src}" alt="${nombre}" /></div>`;
}

function popupPerdida(p: MarcadorPerdidaMapa, esMapaIndividual: boolean): string {
  const enlace = esMapaIndividual
    ? ""
    : `<a class="pp-popup-link" href="/mascota/${p.slug}">Ver ficha →</a>`;
  const cerco = p.prediccion?.cerco;
  const lineaCerco = cerco
    ? `Cerco: ~${(p.radioMetros / 1000).toFixed(1)} km — ${cerco.motivoAjuste}`
    : `Cerco de búsqueda: ~${(p.radioMetros / 1000).toFixed(1)} km (raza, tamaño y tiempo perdido)`;
  const perfil = p.prediccion?.perfilConductual.etiqueta
    ? `<div class="pp-popup-meta">${p.prediccion.perfilConductual.etiqueta}</div>`
    : "";
  return `
    ${miniaturaPopup(p.fotoPrincipal, p.nombre)}
    <div class="pp-popup-titulo">📍 Se perdió aquí — ${p.nombre}</div>
    <div class="pp-popup-meta">${p.tipo}${p.lugarPerdida ? ` · ${p.lugarPerdida}` : ""}</div>
    ${perfil}
    <div class="pp-popup-meta">${lineaCerco}</div>
    <div class="pp-popup-meta">${p.totalAvistamientos} avistamiento(s) registrados</div>
    ${enlace}
  `;
}

function popupAvistamiento(a: MarcadorAvistamientoMapa): string {
  const titulo = a.nombreMascota
    ? `${a.nombreMascota} — Avistamiento #${a.numeroReporte}`
    : `Avistamiento #${a.numeroReporte}`;
  const foto = a.fotoAvistamiento ?? a.fotoMascota;
  return `
    ${miniaturaPopup(foto, a.nombreMascota ?? "Mascota")}
    <div class="pp-popup-titulo">${titulo}</div>
    <div class="pp-popup-meta">${textoDireccion(a.direccion)}</div>
    ${a.slugMascota ? `<a class="pp-popup-link" href="/mascota/${a.slugMascota}">Ver ficha →</a>` : ""}
  `;
}

function popupGrupoAvistamientos(grupo: MarcadorAvistamientoMapa[]): string {
  if (grupo.length === 1) return popupAvistamiento(grupo[0]);

  return grupo
    .map(
      (a, i) =>
        `${i > 0 ? '<div class="pp-popup-separador"></div>' : ""}${popupAvistamiento(a)}`
    )
    .join("");
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

  const coloresPorMascota = useMemo(() => {
    if (!cercoColorPorPerdida || !datos?.perdidas.length) {
      return new Map<string, EstiloFamiliaMascota>();
    }
    return mapaEstilosPorMascota(datos.perdidas.map((p) => p.id));
  }, [cercoColorPorPerdida, datos?.perdidas]);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const capasRef = useRef<L.LayerGroup | null>(null);
  const calorRef = useRef<L.Layer | null>(null);
  const usuarioRef = useRef<L.Marker | null>(null);
  const precisionRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return;

    configurarIconosLeaflet();

    const centro = centrarEnUsuario ?? calcularCentro(datos);
    const mapa = L.map(contenedorRef.current, {
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

    let ro: ResizeObserver | undefined;
    let rafResize = 0;
    if (altura === "ficha" && contenedorRef.current.parentElement) {
      const wrap = contenedorRef.current.parentElement;
      const contenedor = contenedorRef.current;
      ro = new ResizeObserver(() => {
        cancelAnimationFrame(rafResize);
        rafResize = requestAnimationFrame(() => {
          invalidarTamanoMapaSeguro(mapa, contenedor);
        });
      });
      ro.observe(wrap);
      window.setTimeout(
        () => invalidarTamanoMapaSeguro(mapa, contenedor),
        120
      );
    }

    return () => {
      cancelAnimationFrame(rafResize);
      ro?.disconnect();
      mapa.remove();
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

    capas.clearLayers();
    if (calorRef.current) {
      mapa.removeLayer(calorRef.current);
      calorRef.current = null;
    }

    if (datos && mostrarCalorEfectivo && datos.puntosCalor.length > 0) {
      calorRef.current = L.heatLayer(datos.puntosCalor, {
        radius: 28,
        blur: 22,
        maxZoom: 17,
        gradient: {
          0.2: "#3b82f6",
          0.5: "#eab308",
          0.8: "#f97316",
          1: "#ef4444",
        },
      }).addTo(mapa);
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

          L.circle([p.lat, p.lng], {
            radius: radio,
            color: estiloFamilia.color,
            fillColor: estiloFamilia.fillColor,
            fillOpacity: 0.14,
            weight: 2,
            dashArray: "6 4",
          })
            .bindPopup(
              `<div class="pp-popup-titulo">Zona de búsqueda — ${p.nombre}</div><div class="pp-popup-meta">~${(radio / 1000).toFixed(1)} km desde donde se perdió</div>`
            )
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
            fallbackEmoji: emojiPorTipo(p.tipo),
            tamano: TAMANO_MARCADOR_FOTO,
            colorFamilia: cercoColorPorPerdida
              ? estiloFamilia.color
              : undefined,
          }),
          zIndexOffset: 1000,
        })
          .bindPopup(popupPerdida(p, esMapaIndividual))
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
          .bindPopup(
            `<div class="pp-popup-titulo">🏠 Refugio probable</div><div class="pp-popup-meta">${z.etiqueta} · ${Math.round(z.probabilidad * 100)}%</div>`
          )
          .addTo(capas);

        L.marker([z.lat, z.lng], {
          icon: iconoHtml("🏠", "pp-marcador--refugio"),
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

        const icon = iconoFoto(fotoPin, {
          clase: "pp-marcador--avistamiento",
          fallbackEmoji: "📍",
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
      mapa.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 14 });
    } else if (bounds.length === 1) {
      mapa.setView(bounds[0], 14);
    }

    if (altura === "ficha") {
      const contenedor = contenedorRef.current;
      const id = window.setTimeout(
        () => invalidarTamanoMapaSeguro(mapa, contenedor),
        80
      );
      return () => window.clearTimeout(id);
    }
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
    if (punto && coordenadasValidas(punto)) {
      const precision = punto.precisionMetros;
      if (precision && precision > 0 && precision < 500) {
        precisionRef.current = L.circle([punto.lat, punto.lng], {
          radius: precision,
          color: "#4285F4",
          fillColor: "#4285F4",
          fillOpacity: 0.15,
          weight: 1,
        }).addTo(mapa);
      }

      const etiquetaPopup = punto.etiqueta?.trim() || "Tu ubicación";
      usuarioRef.current = L.marker([punto.lat, punto.lng], {
        icon: iconoUbicacionUsuario(),
        zIndexOffset: 1000,
      })
        .bindPopup(
          `<div class="pp-popup-titulo">📍 Estás aquí</div><div class="pp-popup-meta">${etiquetaPopup}</div>`
        )
        .addTo(mapa);

      mapa.flyTo([punto.lat, punto.lng], 17, {
        animate: true,
        duration: 0.8,
      });
    }
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
          {geolocalizando ? "⏳" : "🎯"}
          <span>{geolocalizando ? "Ubicando…" : "Ubicarme"}</span>
        </button>
      )}
    </div>
  );
}
