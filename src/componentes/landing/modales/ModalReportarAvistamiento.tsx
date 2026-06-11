"use client";



/**
 * [landing] Modal: reportar avistamiento.
 */
/**
 * [landing] Modal: reportar avistamiento.
 */
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ModalContenedor } from "@/componentes/landing/modales/ModalContenedor";
import { AccionesWizardReporteConIcono } from "@/componentes/landing/modales/ui/AccionesWizardReporte";
import { AvisoLoginAntesPublicar } from "@/componentes/landing/modales/ui/AvisoLoginAntesPublicar";
import { EncabezadoModalReporte } from "@/componentes/landing/modales/ui/EncabezadoModalReporte";
import { FormularioWizardReporte } from "@/componentes/landing/modales/ui/FormularioWizardReporte";
import { SeccionUbicacionReporte } from "@/componentes/landing/modales/ui/SeccionUbicacionReporte";
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
import { Icono } from "@/componentes/ui/Icono";
import { preprocesarImagenCliente } from "@/lib/imagen/preprocesar-cliente";
import { TIPOS_MASCOTA } from "@/lib/mascotas/tipos";
import { parsearRaza } from "@/lib/mascotas/razas";
import { DIRECCIONES_MOVIMIENTO } from "@/lib/mascotas/catalogos";
import { CampoRaza } from "@/componentes/formulario/CampoRaza";
import { CampoTamano } from "@/componentes/formulario/CampoTamano";
import { CampoTipoMascota } from "@/componentes/formulario/CampoTipoMascota";
import { useRazaPorTipo } from "@/hooks/useRazaPorTipo";
import { useUbicacionReporte } from "@/hooks/useUbicacionReporte";
import { useWizardReporte } from "@/hooks/useWizardReporte";
import { coordenadasValidas } from "@/lib/geo/tipos";
import {
  MSG_UBICACION_AVISTAMIENTO,
  MSG_UBICACION_CORTA_AVISTAMIENTO,
  errorSiSinUbicacion,
} from "@/lib/reportes/validaciones";
import { useModales } from "@/contexto/ContextoModales";
import { IdentificacionPorFoto } from "@/componentes/visual/IdentificacionPorFoto";
import { SubirFotoAvistamiento } from "@/componentes/avistamientos/SubirFotoAvistamiento";
import type { CoincidenciaVisual } from "@/lib/visual/tipos";
import type { CaracteristicasVisuales } from "@/lib/visual/extraer-caracteristicas";
import { TAMANOS } from "@/lib/mascotas/catalogos";
import { CampoFechaHora } from "@/componentes/formulario/CampoFechaHora";
import { valorDatetimeLocalActual } from "@/lib/fechas/datetime-local";
import { PanelExitoReporte } from "@/componentes/landing/modales/PanelExitoReporte";

const PASOS_AVISTAMIENTO = [
  { id: 1, titulo: "Foto" },
  { id: 2, titulo: "Lugar" },
  { id: 3, titulo: "Publicar" },
] as const;

const PASOS_FICHA = [
  { id: 1, titulo: "Dónde la viste" },
  { id: 2, titulo: "Publicar" },
] as const;

const AVISO_LOGIN =
  "Al publicar, guardaremos tu reporte y te pediremos iniciar sesión.";

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
  const { mascotaAvistamiento: mascotaFijada } = useModales();
  const { status: estadoSesion } = useSession();
  const sesionActiva = estadoSesion === "authenticated";
  const avistamientoDesdeFicha = Boolean(mascotaFijada?.id);

  const pasos = avistamientoDesdeFicha ? PASOS_FICHA : PASOS_AVISTAMIENTO;
  const pasoFinalWizard = pasos.length;

  const [mascotaSeleccionada, setMascotaSeleccionada] = useState("");
  const {
    tipo,
    setTipo,
    onTipoChange,
    razaSeleccion,
    setRazaSeleccion,
    razaOtra,
    setRazaOtra,
    razaCompuesta,
  } = useRazaPorTipo();
  const [color, setColor] = useState("");
  const { ubicacion, setUbicacion, direccion, setDireccion, limpiarUbicacion } =
    useUbicacionReporte();
  const [identificadaPorFoto, setIdentificadaPorFoto] =
    useState<CoincidenciaVisual | null>(null);
  const [fotoAvistamiento, setFotoAvistamiento] = useState<string | null>(null);
  const [tamano, setTamano] = useState("");
  const [fechaAvistamiento, setFechaAvistamiento] = useState(
    valorDatetimeLocalActual
  );
  const [referencias, setReferencias] = useState("");
  const [direccionMovimiento, setDireccionMovimiento] = useState("");
  const [detallesAbiertos, setDetallesAbiertos] = useState(false);

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

  const restaurarBorrador = useCallback(() => {
    const borrador = leerBorradorAvistamiento();
    if (!borrador) return false;
    restaurarDesdeBorrador(borrador.datos);
    return true;
  }, []);

  const {
    paso,
    setPaso,
    pasoFinal,
    error,
    setError,
    exito,
    setExito,
    setMetaExito,
    avisoBorrador,
    setAvisoBorrador,
    cargando,
    setCargando,
    publicando,
    formRef,
    irAtras,
    irSiguiente,
    verMapaYCerrar,
    cerrarModal,
    solicitarLoginParaPublicar,
    setAvistamientoPendienteAuth,
  } = useWizardReporte({
    modalId: "sighting",
    pasoFinal: pasoFinalWizard,
    tipoPublicando: "avistamiento",
    leerYQuitarExito: leerYQuitarExitoAvistamiento,
    esExitoPublicacion: (r) => Boolean(r.numeroReporte),
    restaurarBorrador,
    omitirRestaurarBorrador: () => avistamientoDesdeFicha,
  });

  function aplicarCoincidenciaFoto(c: CoincidenciaVisual) {
    setIdentificadaPorFoto(c);
    setMascotaSeleccionada(c.mascotaId);
    setError(null);
  }

  useEffect(() => {
    queueMicrotask(() => {
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
    });
  }, [
    mascotaFijada,
    setTipo,
    setRazaSeleccion,
    setRazaOtra,
    setPaso,
    setError,
    setExito,
    setAvisoBorrador,
  ]);

  function validarPasoActual(): string | null {
    if (avistamientoDesdeFicha && paso === 1) {
      return errorSiSinUbicacion(ubicacion, MSG_UBICACION_AVISTAMIENTO);
    }

    if (!avistamientoDesdeFicha && paso === 2) {
      return errorSiSinUbicacion(ubicacion, MSG_UBICACION_AVISTAMIENTO);
    }

    if (paso === pasoFinal && !tipo.trim()) {
      return "Indica si es perro o gato.";
    }

    return null;
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
        raza: razaCompuesta || undefined,
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
      razaCompuesta,
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
    setMetaExito(null);

    if (paso < pasoFinal) {
      irSiguiente(validarPasoActual);
      return;
    }

    const errUbicacion = errorSiSinUbicacion(
      ubicacion,
      MSG_UBICACION_CORTA_AVISTAMIENTO
    );
    if (errUbicacion) {
      setError(errUbicacion);
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
      solicitarLoginParaPublicar({
        guardarBorrador: () => guardarBorradorAvistamiento(datos),
        marcarPendienteStorage: marcarAvistamientoPendienteAuth,
        setFlagContexto: setAvistamientoPendienteAuth,
        mensajeErrorGuardado:
          "No se pudo guardar el reporte (la foto puede ser muy pesada). Prueba con una imagen más pequeña o inicia sesión antes de subirla.",
      });
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
    setMetaExito({ numeroReporte: resultado.numeroReporte });
    limpiarUbicacion();
    setFotoAvistamiento(null);
  }

  if (exito) {
    return (
      <PanelExitoReporte
          tipo="sighting"
          titulo="Avistamiento publicado"
          subtitulo="Gracias por ayudar. El reporte ya está visible en el mapa."
          mensaje={exito}
          accentMint
          onVerMapa={verMapaYCerrar}
          onCerrar={cerrarModal}
        />
    );
  }

  return (
    <ModalContenedor tipo="sighting">
      <OverlayPublicando
        visible={publicando}
        mensaje="Publicando tu avistamiento…"
      />
      <EncabezadoModalReporte
        tipo="sighting"
        accent="mint"
        titulo="Vi una mascota"
        subtitulo={
          avistamientoDesdeFicha && mascotaFijada ? (
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
          )
        }
      />
      <FormularioWizardReporte
        formRef={formRef}
        onSubmit={enviar}
        avisoBorrador={avisoBorrador}
        error={error}
        pasos={pasos}
        pasoActivo={paso}
        etiquetaPasos="Progreso del avistamiento"
      >
        {avistamientoDesdeFicha && mascotaFijada && (
          <div className="pp-avistamiento-ficha-fijada" role="status">
            <span className="pp-avistamiento-ficha-fijada-icono">
              <Icono nombre="huella" size={24} />
            </span>
            <div>
              <strong>Mascota: {mascotaFijada.nombre}</strong>
            </div>
            <input type="hidden" name="mascotaId" value={mascotaFijada.id} />
          </div>
        )}

        {/* Paso 1 general: foto + IA */}
        {!avistamientoDesdeFicha && (
          <div className={paso === 1 ? "" : "pp-wizard-oculto"}>
            <div className="section-divider">
              <Icono nombre="camara" size={16} className="pp-icon--btn" /> Foto (recomendada)
            </div>
            <SubirFotoAvistamiento
              foto={fotoAvistamiento}
              onChange={setFotoAvistamiento}
            />
            <div className="section-divider">Buscar coincidencias</div>
            <p className="form-ficha-ayuda" style={{ marginTop: 0 }}>
              Opcional: sube otra foto aquí solo para comparar con mascotas
              perdidas. Es independiente de la foto de evidencia de arriba.
            </p>
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
                <span className="foto-ia-seleccion-banner-icono">
                  <Icono nombre="check" size={18} />
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
          <SeccionUbicacionReporte
            tituloSeccion="Ubicación donde la viste"
            etiqueta="¿Dónde la viste? *"
            idInput="sighting-location"
            icono="ojo"
            valor={ubicacion}
            onChange={setUbicacion}
            direccion={direccion}
            onDireccionChange={setDireccion}
          >
            {avistamientoDesdeFicha && (
              <>
                <div className="section-divider">Foto del avistamiento (opcional)</div>
                <SubirFotoAvistamiento
                  foto={fotoAvistamiento}
                  onChange={setFotoAvistamiento}
                />
              </>
            )}
          </SeccionUbicacionReporte>
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
              onChange={onTipoChange}
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

        <AvisoLoginAntesPublicar
          visible={paso === pasoFinal && !sesionActiva}
          mensaje={AVISO_LOGIN}
        />

        <AccionesWizardReporteConIcono
          paso={paso}
          pasoFinal={pasoFinal}
          publicando={publicando}
          irAtras={irAtras}
          textoCargando="Publicando..."
          textoEnviar="Publicar avistamiento"
          iconoEnviar="ojo"
          classNameSubmit="submit-btn submit-btn-blue"
        />
      </FormularioWizardReporte>
    </ModalContenedor>
  );
}
