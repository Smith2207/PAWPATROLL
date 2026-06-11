/**
 * [landing] Modal: reportar avistamiento.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AccionesWizardReporteConIcono } from "@/componentes/landing/modales/ui/AccionesWizardReporte";
import { AvisoLoginAntesPublicar } from "@/componentes/landing/modales/ui/AvisoLoginAntesPublicar";
import { FormularioWizardReporte } from "@/componentes/landing/modales/ui/FormularioWizardReporte";
import { ShellModalReporte } from "@/componentes/landing/modales/ui/ShellModalReporte";
import { BannerMascotaFijada } from "@/componentes/landing/modales/avistamiento/BannerMascotaFijada";
import { PasoFotoAvistamiento } from "@/componentes/landing/modales/avistamiento/PasoFotoAvistamiento";
import { PasoPublicarAvistamiento } from "@/componentes/landing/modales/avistamiento/PasoPublicarAvistamiento";
import { PasoUbicacionAvistamiento } from "@/componentes/landing/modales/avistamiento/PasoUbicacionAvistamiento";
import { PanelExitoReporte } from "@/componentes/landing/modales/PanelExitoReporte";
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
import {
  camposDesdeBorradorAvistamiento,
  parcheCaracteristicasVisuales,
  prepararDatosAvistamientoPublicacion,
  validarPasoAvistamiento,
  validarPublicacionAvistamiento,
} from "@/lib/avistamientos/formulario-borrador";
import { valorDatetimeLocalActual } from "@/lib/fechas/datetime-local";
import { tipoMascotaDesdeTexto } from "@/lib/mascotas/tipos";
import { parsearRaza } from "@/lib/mascotas/razas";
import {
  AVISO_LOGIN_REPORTE_AVISTAMIENTO,
  MENSAJE_ERROR_GUARDADO_AVISTAMIENTO,
} from "@/lib/reportes/mensajes";
import {
  PASOS_WIZARD_AVISTAMIENTO,
  PASOS_WIZARD_AVISTAMIENTO_FICHA,
} from "@/lib/reportes/pasos-wizard";
import {
  clasePasoWizardCondicional,
  clasePasoWizardVisible,
} from "@/lib/reportes/wizard-ui";
import { useModales } from "@/contexto/ContextoModales";
import { useRazaPorTipo } from "@/hooks/useRazaPorTipo";
import { useUbicacionReporte } from "@/hooks/useUbicacionReporte";
import { useWizardReporte } from "@/hooks/useWizardReporte";
import type { CoincidenciaVisual } from "@/lib/visual/tipos";
import type { CaracteristicasVisuales } from "@/lib/visual/extraer-caracteristicas";

type Props = {
  mascotasPerdidas?: { id: string; nombre: string; slug: string }[];
};

export function ModalReportarAvistamiento({
  mascotasPerdidas = [],
}: Props) {
  const { mascotaAvistamiento: mascotaFijada } = useModales();
  const { status: estadoSesion } = useSession();
  const sesionActiva = estadoSesion === "authenticated";
  const avistamientoDesdeFicha = Boolean(mascotaFijada?.id);

  const pasos = avistamientoDesdeFicha
    ? PASOS_WIZARD_AVISTAMIENTO_FICHA
    : PASOS_WIZARD_AVISTAMIENTO;
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
    const campos = camposDesdeBorradorAvistamiento(datos);
    setUbicacion(campos.ubicacion);
    setDireccion(campos.direccion);
    setTipo(campos.tipo);
    setColor(campos.color);
    setRazaSeleccion(campos.razaSeleccion);
    setRazaOtra(campos.razaOtra);
    setTamano(campos.tamano);
    setFotoAvistamiento(campos.fotoAvistamiento);
    setReferencias(campos.referencias);
    setDireccionMovimiento(campos.direccionMovimiento);
    if (campos.fechaAvistamiento) setFechaAvistamiento(campos.fechaAvistamiento);
    if (campos.mascotaSeleccionada) {
      setMascotaSeleccionada(campos.mascotaSeleccionada);
    }
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

  useEffect(() => {
    queueMicrotask(() => {
      if (!mascotaFijada) {
        setMascotaSeleccionada("");
        return;
      }
      setMascotaSeleccionada(mascotaFijada.id);
      const tipoIni = tipoMascotaDesdeTexto(mascotaFijada.tipo);
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

  const prepararDatosDesdeForm = useCallback(
    (fd: FormData) =>
      prepararDatosAvistamientoPublicacion(fd, {
        ubicacion,
        mascotaId: mascotaFijada?.id,
        mascotaSeleccionada,
        direccion,
        tipo,
        tamano,
        color,
        razaCompuesta,
        fotoAvistamiento,
        referencias,
        direccionMovimiento,
        fechaAvistamiento,
      }),
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

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setExito(null);
    setMetaExito(null);

    if (paso < pasoFinal) {
      irSiguiente(() =>
        validarPasoAvistamiento({
          paso,
          pasoFinal,
          avistamientoDesdeFicha,
          ubicacion,
          tipo,
        })
      );
      return;
    }

    const errPublicacion = validarPublicacionAvistamiento({ ubicacion, tipo });
    if (errPublicacion) {
      setError(errPublicacion);
      if (errPublicacion.includes("mapa")) {
        setPaso(avistamientoDesdeFicha ? 1 : 2);
      }
      return;
    }

    const datos = await prepararDatosDesdeForm(new FormData(e.currentTarget));
    if (!datos) return;

    if (!sesionActiva) {
      solicitarLoginParaPublicar({
        guardarBorrador: () => guardarBorradorAvistamiento(datos),
        marcarPendienteStorage: marcarAvistamientoPendienteAuth,
        setFlagContexto: setAvistamientoPendienteAuth,
        mensajeErrorGuardado: MENSAJE_ERROR_GUARDADO_AVISTAMIENTO,
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
    <ShellModalReporte
      tipo="sighting"
      accent="mint"
      publicando={publicando}
      mensajePublicando="Publicando tu avistamiento…"
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
            {paso === 3 && "Revisa y publica. Los detalles extra son opcionales."}
          </>
        )
      }
    >
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
          <BannerMascotaFijada
            id={mascotaFijada.id}
            nombre={mascotaFijada.nombre}
          />
        )}

        {!avistamientoDesdeFicha && (
          <div className={clasePasoWizardVisible(paso, 1)}>
            <PasoFotoAvistamiento
              fotoAvistamiento={fotoAvistamiento}
              onFotoChange={setFotoAvistamiento}
              identificadaPorFoto={identificadaPorFoto}
              onElegirCoincidencia={(c) => {
                setIdentificadaPorFoto(c);
                setMascotaSeleccionada(c.mascotaId);
                setError(null);
              }}
              onCaracteristicas={(c: CaracteristicasVisuales) => {
                const parche = parcheCaracteristicasVisuales(c, {
                  color,
                  tamano,
                });
                if (parche.color !== undefined) setColor(parche.color);
                if (parche.tamano !== undefined) setTamano(parche.tamano);
              }}
              tipo={tipo}
              color={color}
              ubicacion={ubicacion}
            />
          </div>
        )}

        <div
          className={clasePasoWizardCondicional(
            (avistamientoDesdeFicha && paso === 1) ||
              (!avistamientoDesdeFicha && paso === 2)
          )}
        >
          <PasoUbicacionAvistamiento
            avistamientoDesdeFicha={avistamientoDesdeFicha}
            ubicacion={ubicacion}
            onUbicacionChange={setUbicacion}
            direccion={direccion}
            onDireccionChange={setDireccion}
            fotoAvistamiento={fotoAvistamiento}
            onFotoChange={setFotoAvistamiento}
          />
        </div>

        <div className={clasePasoWizardVisible(paso, pasoFinal)}>
          <PasoPublicarAvistamiento
            avistamientoDesdeFicha={avistamientoDesdeFicha}
            mascotaFijadaTipo={mascotaFijada?.tipo}
            mascotasPerdidas={mascotasPerdidas}
            mascotaSeleccionada={mascotaSeleccionada}
            onMascotaSeleccionadaChange={setMascotaSeleccionada}
            tipo={tipo}
            onTipoChange={onTipoChange}
            tamano={tamano}
            onTamanoChange={setTamano}
            fechaAvistamiento={fechaAvistamiento}
            onFechaAvistamientoChange={setFechaAvistamiento}
            detallesAbiertos={detallesAbiertos}
            onDetallesAbiertosChange={setDetallesAbiertos}
            color={color}
            onColorChange={setColor}
            razaSeleccion={razaSeleccion}
            razaOtra={razaOtra}
            onRazaSeleccionChange={setRazaSeleccion}
            onRazaOtraChange={setRazaOtra}
            direccionMovimiento={direccionMovimiento}
            onDireccionMovimientoChange={setDireccionMovimiento}
            referencias={referencias}
            onReferenciasChange={setReferencias}
          />
        </div>

        <AvisoLoginAntesPublicar
          visible={paso === pasoFinal && !sesionActiva}
          mensaje={AVISO_LOGIN_REPORTE_AVISTAMIENTO}
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
    </ShellModalReporte>
  );
}
