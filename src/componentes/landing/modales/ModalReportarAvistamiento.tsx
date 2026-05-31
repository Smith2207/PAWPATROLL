"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BotonCerrarModal,
  ModalContenedor,
} from "@/componentes/landing/modales/ModalContenedor";
import { SelectorUbicacionMapa } from "@/componentes/landing/ui/SelectorUbicacionMapa";
import {
  crearAvistamiento,
  type DatosAvistamiento,
} from "@/actions/avistamientos";
import {
  guardarBorradorAvistamiento,
  leerBorradorAvistamiento,
  leerYQuitarExitoAvistamiento,
  marcarAvistamientoPendienteAuth,
} from "@/lib/avistamientos/borrador-cliente";
import { OverlayPublicando } from "@/componentes/ui/OverlayPublicando";
import { preprocesarImagenCliente } from "@/lib/imagen/preprocesar-cliente";
import { TIPOS_MASCOTA } from "@/lib/mascotas/tipos";
import {
  componerRaza,
  obtenerRazasPorTipo,
  OPCION_RAZA_OTRA,
  parsearRaza,
} from "@/lib/mascotas/razas";
import {
  DIRECCIONES_MOVIMIENTO,
  PLACEHOLDER_UBICACION,
} from "@/lib/mascotas/catalogos";
import { CampoRaza } from "@/componentes/formulario/CampoRaza";
import { CampoTamano } from "@/componentes/formulario/CampoTamano";
import { CampoTipoMascota } from "@/componentes/formulario/CampoTipoMascota";
import type { UbicacionSeleccionada } from "@/lib/geo/tipos";
import { coordenadasValidas } from "@/lib/geo/tipos";
import { useModales } from "@/contexto/ContextoModales";
import { IdentificacionPorFoto } from "@/componentes/visual/IdentificacionPorFoto";
import { SubirFotoAvistamiento } from "@/componentes/avistamientos/SubirFotoAvistamiento";
import type { CoincidenciaVisual } from "@/lib/visual/tipos";
import type { CaracteristicasVisuales } from "@/lib/visual/extraer-caracteristicas";
import { TAMANOS } from "@/lib/mascotas/catalogos";
import { CampoFechaHora } from "@/componentes/formulario/CampoFechaHora";
import { valorDatetimeLocalActual } from "@/lib/fechas/datetime-local";
import { RUTAS_LANDING } from "@/lib/landing/rutas";

const PASOS_AVISTAMIENTO = [
  { id: 1, titulo: "Foto" },
  { id: 2, titulo: "Lugar" },
  { id: 3, titulo: "Publicar" },
] as const;

const PASOS_FICHA = [
  { id: 1, titulo: "Dónde la viste" },
  { id: 2, titulo: "Publicar" },
] as const;

type Props = {
  mascotasPerdidas?: { id: string; nombre: string; slug: string }[];
};

function tipoInicial(mascotaFijada: ReturnType<typeof useModales>["mascotaAvistamiento"]) {
  const t = mascotaFijada?.tipo?.trim();
  if (t && TIPOS_MASCOTA.includes(t as (typeof TIPOS_MASCOTA)[number])) return t;
  return "";
}

export function ModalReportarAvistamiento({
  mascotasPerdidas = [],
}: Props) {
  const {
    cerrarModal,
    abrirModal,
    mascotaAvistamiento: mascotaFijada,
    setAvistamientoPendienteAuth,
    modalAbierto,
    publicandoReporte,
  } = useModales();
  const router = useRouter();
  const { status: estadoSesion } = useSession();
  const sesionActiva = estadoSesion === "authenticated";
  const avistamientoDesdeFicha = Boolean(mascotaFijada?.id);

  const [mascotaSeleccionada, setMascotaSeleccionada] = useState("");
  const [tipo, setTipo] = useState("");
  const [color, setColor] = useState("");
  const [razaSeleccion, setRazaSeleccion] = useState("");
  const [razaOtra, setRazaOtra] = useState("");
  const [ubicacion, setUbicacion] = useState<UbicacionSeleccionada | null>(null);
  const [direccion, setDireccion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [identificadaPorFoto, setIdentificadaPorFoto] =
    useState<CoincidenciaVisual | null>(null);
  const [fotoAvistamiento, setFotoAvistamiento] = useState<string | null>(null);
  const [tamano, setTamano] = useState("");
  const [fechaAvistamiento, setFechaAvistamiento] = useState(
    valorDatetimeLocalActual
  );
  const [referencias, setReferencias] = useState("");
  const [direccionMovimiento, setDireccionMovimiento] = useState("");
  const [avisoBorrador, setAvisoBorrador] = useState(false);
  const [paso, setPaso] = useState(1);
  const [detallesAbiertos, setDetallesAbiertos] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const pasos = avistamientoDesdeFicha ? PASOS_FICHA : PASOS_AVISTAMIENTO;
  const pasoFinal = pasos.length;

  function aplicarCoincidenciaFoto(c: CoincidenciaVisual) {
    setIdentificadaPorFoto(c);
    setMascotaSeleccionada(c.mascotaId);
    setError(null);
  }

  useEffect(() => {
    if (!mascotaFijada) {
      setMascotaSeleccionada("");
      return;
    }
    setMascotaSeleccionada(mascotaFijada.id);
    const tipoIni = tipoInicial(mascotaFijada);
    setTipo(tipoIni);
    setColor(mascotaFijada.color ?? "");
    const razaIni = parsearRaza(tipoIni, mascotaFijada.raza);
    setRazaSeleccion(razaIni.seleccion);
    setRazaOtra(razaIni.otra);
    setUbicacion(null);
    setDireccion("");
    setError(null);
    setExito(null);
    setFotoAvistamiento(null);
    setFechaAvistamiento(valorDatetimeLocalActual());
    setReferencias("");
    setDireccionMovimiento("");
    setAvisoBorrador(false);
    setPaso(1);
    setDetallesAbiertos(false);
  }, [mascotaFijada]);

  function aplicarResultadoPublicacion() {
    const resultado = leerYQuitarExitoAvistamiento();
    if (!resultado) return false;
    if (resultado.numeroReporte) {
      setExito(resultado.mensaje);
      setError(null);
      setAvisoBorrador(false);
    } else {
      setExito(null);
      setError(resultado.mensaje);
    }
    return true;
  }

  function restaurarDesdeBorrador(datos: DatosAvistamiento) {
    setUbicacion({ lat: datos.lat, lng: datos.lng });
    setDireccion(datos.direccion ?? "");
    setTipo(datos.tipoMascota ?? "");
    setColor(datos.color ?? "");
    const razaIni = parsearRaza(datos.tipoMascota ?? "", datos.raza);
    setRazaSeleccion(razaIni.seleccion);
    setRazaOtra(razaIni.otra);
    setTamano(datos.tamano ?? "");
    setFotoAvistamiento(datos.fotoUrl ?? null);
    setReferencias(datos.referencias ?? "");
    setDireccionMovimiento(datos.direccionMovimiento ?? "");
    if (datos.fechaHora) setFechaAvistamiento(datos.fechaHora);
    if (datos.mascotaId) setMascotaSeleccionada(datos.mascotaId);
  }

  useEffect(() => {
    const onPublicado = () => aplicarResultadoPublicacion();
    window.addEventListener("pawpatroll:reporte-publicado", onPublicado);
    return () =>
      window.removeEventListener("pawpatroll:reporte-publicado", onPublicado);
  }, []);

  useEffect(() => {
    if (modalAbierto !== "sighting") {
      setPaso(1);
      return;
    }
    if (aplicarResultadoPublicacion()) return;
    if (mascotaFijada) return;

    const borrador = leerBorradorAvistamiento();
    if (!borrador) return;

    restaurarDesdeBorrador(borrador.datos);
    setAvisoBorrador(true);
    setError(null);
    setExito(null);
    restaurarDesdeBorrador(borrador.datos);
    setAvisoBorrador(true);
    setPaso(1);
    setError(null);
    setExito(null);
  }, [modalAbierto, mascotaFijada]);

  const publicando = publicandoReporte === "avistamiento" || cargando;

  function irAtras() {
    setError(null);
    setPaso((p) => Math.max(1, p - 1));
  }

  function validarPasoActual(): string | null {
    if (avistamientoDesdeFicha) {
      if (paso === 1 && !coordenadasValidas(ubicacion)) {
        return "Marca en el mapa dónde la viste (busca la dirección o usa Ubicarme).";
      }
      return null;
    }

    if (paso === 2 && !coordenadasValidas(ubicacion)) {
      return "Marca en el mapa dónde la viste (busca la dirección o usa Ubicarme).";
    }

    if (paso === pasoFinal && !tipo.trim()) {
      return "Indica si es perro o gato.";
    }

    return null;
  }

  function irSiguiente() {
    const err = validarPasoActual();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setPaso((p) => Math.min(pasoFinal, p + 1));
  }

  const armarDatosAvistamiento = useCallback(
    (fd: FormData): DatosAvistamiento | null => {
      if (!coordenadasValidas(ubicacion)) return null;

      const mascotaId =
        mascotaFijada?.id || mascotaSeleccionada || undefined;

      return {
        mascotaId,
        lat: ubicacion.lat,
        lng: ubicacion.lng,
        direccion: direccion.trim() || undefined,
        tipoMascota: tipo,
        tamano: tamano || fd.get("tamano")?.toString(),
        color: color.trim() || undefined,
        raza: componerRaza(razaSeleccion, razaOtra) || undefined,
        fotoUrl: fotoAvistamiento ?? undefined,
        referencias: referencias.trim() || fd.get("referencia")?.toString(),
        direccionMovimiento:
          direccionMovimiento || fd.get("direccionMovimiento")?.toString(),
        fechaHora: fechaAvistamiento,
      };
    },
    [
      ubicacion,
      mascotaFijada,
      mascotaSeleccionada,
      direccion,
      tipo,
      tamano,
      color,
      razaSeleccion,
      razaOtra,
      fotoAvistamiento,
      fechaAvistamiento,
      referencias,
      direccionMovimiento,
    ]
  );

  function aplicarCaracteristicasVisuales(c: CaracteristicasVisuales) {
    if (!color.trim()) {
      setColor(c.colorPredominante);
    }
    if (!tamano) {
      const mapa: Record<string, string> = {
        pequeño: TAMANOS[0],
        mediano: TAMANOS[1],
        grande: TAMANOS[2],
      };
      const t = mapa[c.tamanoEstimado];
      if (t) setTamano(t);
    }
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setExito(null);

    if (paso < pasoFinal) {
      irSiguiente();
      return;
    }

    if (!coordenadasValidas(ubicacion)) {
      setError("Marca en el mapa dónde la viste.");
      setPaso(avistamientoDesdeFicha ? 1 : 2);
      return;
    }

    if (!tipo.trim()) {
      setError("Indica si es perro o gato.");
      return;
    }

    const fd = new FormData(e.currentTarget);
    let datos = armarDatosAvistamiento(fd);
    if (!datos) return;

    if (datos.fotoUrl) {
      datos = {
        ...datos,
        fotoUrl: await preprocesarImagenCliente(datos.fotoUrl, {
          cuadrado: true,
        }),
      };
    }

    if (!sesionActiva) {
      const guardado = guardarBorradorAvistamiento(datos);
      if (!guardado) {
        setError(
          "No se pudo guardar el reporte (la foto puede ser muy pesada). Prueba con una imagen más pequeña o inicia sesión antes de subirla."
        );
        return;
      }
      marcarAvistamientoPendienteAuth();
      setAvistamientoPendienteAuth(true);
      abrirModal("login");
      return;
    }

    setCargando(true);
    const resultado = await crearAvistamiento(datos);
    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setExito(
      resultado.mensaje ??
        `Avistamiento #${resultado.numeroReporte} registrado.`
    );
    setUbicacion(null);
    setDireccion("");
    setFotoAvistamiento(null);
  }

  function verMapaYCerrar() {
    cerrarModal("sighting");
    router.push(`${RUTAS_LANDING.comunidad}#mapa`);
  }

  if (exito) {
    return (
      <ModalContenedor tipo="sighting">
        <OverlayPublicando visible={publicando} />
        <div className="modal-header">
          <div className="modal-header-accent modal-header-accent--mint" />
          <BotonCerrarModal tipo="sighting" />
          <div className="modal-title">Avistamiento publicado</div>
          <div className="modal-sub">
            Gracias por ayudar. El reporte ya está visible en el mapa.
          </div>
        </div>
        <div className="modal-body pp-avistamiento-exito-panel">
          <div className="pp-avistamiento-exito" role="status">
            <span className="pp-avistamiento-exito-icono" aria-hidden>
              ✅
            </span>
            <div>
              <strong>¡Publicado correctamente!</strong>
              <p>{exito}</p>
            </div>
          </div>
          <button
            type="button"
            className="submit-btn submit-btn-blue"
            onClick={verMapaYCerrar}
          >
            🗺️ Ver en el mapa
          </button>
          <button
            type="button"
            className="submit-btn"
            onClick={() => cerrarModal("sighting")}
          >
            Cerrar
          </button>
        </div>
      </ModalContenedor>
    );
  }

  return (
    <ModalContenedor tipo="sighting">
      <OverlayPublicando
        visible={publicando}
        mensaje="Publicando tu avistamiento…"
      />
      <div className="modal-header">
        <div className="modal-header-accent modal-header-accent--mint" />
        <BotonCerrarModal tipo="sighting" />
        <div className="modal-title">Vi una mascota</div>
        <div className="modal-sub">
          {avistamientoDesdeFicha && mascotaFijada ? (
            <>
              Reporte rápido para <strong>{mascotaFijada.nombre}</strong>. Marca
              dónde la viste y publica en menos de un minuto.
            </>
          ) : (
            <>
              {paso === 1 &&
                "Opcional: sube una foto para buscar coincidencias con mascotas perdidas."}
              {paso === 2 && "Marca el punto exacto donde la viste."}
              {paso === 3 &&
                "Revisa y publica. Los detalles extra son opcionales."}
            </>
          )}
        </div>
      </div>
      <form ref={formRef} className="modal-body" noValidate onSubmit={enviar}>
        {avisoBorrador && (
          <p className="auth-alerta auth-alerta--info" role="status">
            Recuperamos tu borrador. Revisa los datos y continúa para publicar.
          </p>
        )}
        {error && (
          <p className="auth-alerta auth-alerta--error">{error}</p>
        )}

        <div className="auth-pasos" aria-label="Progreso del avistamiento">
          {pasos.map((p) => (
            <div
              key={p.id}
              className={`auth-paso ${paso === p.id ? "auth-paso--activo" : ""} ${paso > p.id ? "auth-paso--hecho" : ""}`}
            >
              <span className="auth-paso-num">{p.id}</span>
              <span className="auth-paso-titulo">{p.titulo}</span>
            </div>
          ))}
        </div>

        {avistamientoDesdeFicha && mascotaFijada && (
          <div className="pp-avistamiento-ficha-fijada" role="status">
            <span className="pp-avistamiento-ficha-fijada-icono" aria-hidden>
              🐾
            </span>
            <div>
              <strong>Mascota: {mascotaFijada.nombre}</strong>
              <p>Este avistamiento quedará vinculado a su ficha.</p>
            </div>
            <input type="hidden" name="mascotaId" value={mascotaFijada.id} />
          </div>
        )}

        {/* Paso 1 general: foto + IA */}
        {!avistamientoDesdeFicha && (
          <div className={paso === 1 ? "" : "pp-wizard-oculto"}>
            <div className="section-divider">📷 Foto (recomendada)</div>
            <SubirFotoAvistamiento
              foto={fotoAvistamiento}
              onChange={setFotoAvistamiento}
            />
            <div className="section-divider">Buscar coincidencias</div>
            <IdentificacionPorFoto
              compacto
              onElegir={aplicarCoincidenciaFoto}
              onCaracteristicas={aplicarCaracteristicasVisuales}
              mascotaSeleccionadaId={identificadaPorFoto?.mascotaId}
              filtros={{
                tipoMascota: tipo || undefined,
                color: color.trim() || undefined,
                lat: ubicacion?.lat,
                lng: ubicacion?.lng,
              }}
            />
            {identificadaPorFoto && (
              <div className="foto-ia-seleccion-banner" role="status">
                <span className="foto-ia-seleccion-banner-icono" aria-hidden>
                  ✓
                </span>
                <div>
                  <strong>{identificadaPorFoto.nombre}</strong> seleccionada
                  <p>El avistamiento quedará vinculado a esta mascota.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Paso 2 general / Paso 1 ficha: mapa */}
        <div
          className={
            (avistamientoDesdeFicha && paso === 1) ||
            (!avistamientoDesdeFicha && paso === 2)
              ? ""
              : "pp-wizard-oculto"
          }
        >
          <div className="section-divider">📍 Ubicación donde la viste</div>
          <SelectorUbicacionMapa
            etiqueta="¿Dónde la viste? *"
            idInput="sighting-location"
            icono="👁️"
            placeholder={PLACEHOLDER_UBICACION}
            valor={ubicacion}
            onChange={setUbicacion}
            direccionTexto={direccion}
            onDireccionChange={setDireccion}
          />
          {avistamientoDesdeFicha && (
            <>
              <div className="section-divider">Foto del avistamiento (opcional)</div>
              <SubirFotoAvistamiento
                foto={fotoAvistamiento}
                onChange={setFotoAvistamiento}
              />
            </>
          )}
        </div>

        {/* Paso final: confirmar y publicar */}
        <div className={paso === pasoFinal ? "" : "pp-wizard-oculto"}>
          {!avistamientoDesdeFicha && mascotasPerdidas.length > 0 && (
            <div className="form-group">
              <label>¿De qué mascota perdida es el avistamiento?</label>
              <select
                name="mascotaId"
                value={mascotaSeleccionada}
                onChange={(e) => setMascotaSeleccionada(e.target.value)}
              >
                <option value="">No estoy seguro / avistamiento general</option>
                {mascotasPerdidas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row">
            <CampoTipoMascota
              value={tipo}
              onChange={(nuevoTipo) => {
                setTipo(nuevoTipo);
                if (
                  razaSeleccion &&
                  razaSeleccion !== OPCION_RAZA_OTRA &&
                  !obtenerRazasPorTipo(nuevoTipo).includes(razaSeleccion)
                ) {
                  setRazaSeleccion("");
                  setRazaOtra("");
                }
              }}
              requerido
              deshabilitado={
                avistamientoDesdeFicha && Boolean(mascotaFijada?.tipo)
              }
              label="¿Perro o gato?"
            />
            <CampoTamano
              label="Tamaño aproximado"
              vacio="—"
              value={tamano}
              onChange={setTamano}
            />
          </div>

          <CampoFechaHora
            label="Fecha y hora del avistamiento"
            id="sighting-datetime"
            value={fechaAvistamiento}
            onChange={setFechaAvistamiento}
            requerido
          />

          <button
            type="button"
            className="pp-detalles-toggle"
            aria-expanded={detallesAbiertos}
            onClick={() => setDetallesAbiertos((v) => !v)}
          >
            {detallesAbiertos ? "▾ Ocultar detalles" : "▸ Añadir más detalles (opcional)"}
          </button>

          {detallesAbiertos && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Color principal</label>
                  <input
                    name="color"
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Ej: negro con blanco"
                  />
                </div>
                <CampoRaza
                  tipo={tipo}
                  seleccion={razaSeleccion}
                  otra={razaOtra}
                  onSeleccionChange={setRazaSeleccion}
                  onOtraChange={setRazaOtra}
                  label="Raza (si la identificas)"
                />
              </div>
              <div className="form-group">
                <label>¿En qué dirección se movía?</label>
                <select
                  name="direccionMovimiento"
                  value={direccionMovimiento}
                  onChange={(e) => setDireccionMovimiento(e.target.value)}
                >
                  {DIRECCIONES_MOVIMIENTO.map((d) => (
                    <option key={d} value={d === "No lo noté" ? "" : d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Referencia y más detalles</label>
                <textarea
                  name="referencia"
                  rows={3}
                  value={referencias}
                  onChange={(e) => setReferencias(e.target.value)}
                  placeholder="Ej: Llevaba collar rojo, esquina con la farmacia..."
                />
              </div>
            </>
          )}
        </div>

        {paso === pasoFinal && !sesionActiva && (
          <p className="auth-alerta auth-alerta--info" role="note">
            Al publicar, guardaremos tu reporte y te pediremos iniciar sesión.
          </p>
        )}

        <div className="auth-pasos-acciones">
          {paso > 1 && (
            <button
              type="button"
              className="btn-mascota btn-mascota--secundario"
              onClick={irAtras}
              disabled={publicando}
            >
              Atrás
            </button>
          )}
          <button
            type="submit"
            className="submit-btn submit-btn-blue"
            disabled={publicando}
          >
            {publicando
              ? "Publicando..."
              : paso < pasoFinal
                ? "Continuar"
                : "👁️ Publicar avistamiento"}
          </button>
        </div>
      </form>
    </ModalContenedor>
  );
}
