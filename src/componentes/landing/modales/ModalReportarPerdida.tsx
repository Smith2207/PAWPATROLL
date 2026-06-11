/**
 * [landing] Modal: reportar perdida.
 */
"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AccionesWizardReporteConIcono } from "@/componentes/landing/modales/ui/AccionesWizardReporte";
import { AvisoLoginAntesPublicar } from "@/componentes/landing/modales/ui/AvisoLoginAntesPublicar";
import { FormularioWizardReporte } from "@/componentes/landing/modales/ui/FormularioWizardReporte";
import { ShellModalReporte } from "@/componentes/landing/modales/ui/ShellModalReporte";
import { PasoContactoPerdida } from "@/componentes/landing/modales/perdida/PasoContactoPerdida";
import { PasoUbicacionFotosPerdida } from "@/componentes/landing/modales/perdida/PasoUbicacionFotosPerdida";
import { PanelExitoReporte } from "@/componentes/landing/modales/PanelExitoReporte";
import {
  FormularioDatosMascota,
  type ValoresInicialesFichaMascota,
} from "@/componentes/landing/modales/FormularioDatosMascota";
import { useCamaraReporte } from "@/hooks/useCamaraReporte";
import { useUbicacionReporte } from "@/hooks/useUbicacionReporte";
import { useWizardReporte } from "@/hooks/useWizardReporte";
import {
  guardarBorradorPerdida,
  leerBorradorPerdida,
  leerYQuitarExitoPerdida,
  marcarPerdidaPendienteAuth,
} from "@/lib/perdidas/borrador-cliente";
import {
  armarBorradorPerdida,
  camposDesdeBorradorPerdida,
  validarAvancePasoPerdida,
  validarPublicacionPerdida,
} from "@/lib/perdidas/formulario-borrador";
import { publicarReportePerdida } from "@/lib/perdidas/publicar-reporte";
import {
  AVISO_LOGIN_REPORTE_PERDIDA,
  MENSAJE_ERROR_GUARDADO_PERDIDA,
} from "@/lib/reportes/mensajes";
import { abrirCompartirWhatsAppAlerta } from "@/lib/reportes/compartir";
import { PASOS_WIZARD_PERDIDA } from "@/lib/reportes/pasos-wizard";
import { clasePasoWizardVisible } from "@/lib/reportes/wizard-ui";

export function ModalReportarPerdida() {
  const { data: sesion, status } = useSession();
  const router = useRouter();
  const camara = useCamaraReporte({ idPrefijo: "reporte-perdida" });
  const sesionActiva = status === "authenticated";
  const { ubicacion, setUbicacion, direccion, setDireccion, limpiarUbicacion } =
    useUbicacionReporte();

  const [valoresFicha, setValoresFicha] = useState<
    ValoresInicialesFichaMascota | undefined
  >(undefined);
  const [referenciasZona, setReferenciasZona] = useState("");
  const [contactoNombre, setContactoNombre] = useState("");
  const [contactoTelefono, setContactoTelefono] = useState("");
  const [contactoEmail, setContactoEmail] = useState("");
  const [recompensa, setRecompensa] = useState("");
  const [claveFormulario, setClaveFormulario] = useState(0);

  const restaurarBorrador = useCallback(() => {
    const borrador = leerBorradorPerdida();
    if (!borrador) return false;

    const campos = camposDesdeBorradorPerdida(borrador);
    setValoresFicha(campos.valoresFicha);
    setUbicacion(campos.ubicacion);
    setDireccion(campos.direccion);
    setReferenciasZona(campos.referenciasZona);
    setContactoNombre(campos.contactoNombre);
    setContactoTelefono(campos.contactoTelefono);
    setContactoEmail(campos.contactoEmail);
    setRecompensa(campos.recompensa);
    camara.establecerFotos(campos.fotos);
    setClaveFormulario((k) => k + 1);
    return true;
  }, [camara, setDireccion, setUbicacion]);

  const {
    paso,
    setPaso,
    pasoFinal,
    error,
    setError,
    exito,
    setExito,
    metaExito,
    setMetaExito,
    avisoBorrador,
    cargando,
    setCargando,
    publicando,
    formRef,
    irAtras,
    irSiguiente,
    verMapaYCerrar,
    cerrarModal,
    solicitarLoginParaPublicar,
    setPerdidaPendienteAuth,
  } = useWizardReporte({
    modalId: "report",
    pasoFinal: 3,
    tipoPublicando: "perdida",
    leerYQuitarExito: leerYQuitarExitoPerdida,
    esExitoPublicacion: (r) => Boolean(r.slug),
    restaurarBorrador,
  });

  const slugExito = metaExito?.slug ?? null;

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setExito(null);
    setMetaExito(null);

    if (status === "loading") return;

    const form = e.currentTarget;

    if (paso < pasoFinal) {
      irSiguiente(() =>
        validarAvancePasoPerdida(paso, form, ubicacion, camara.fotosPreview)
      );
      return;
    }

    const errPublicacion = validarPublicacionPerdida(
      form,
      ubicacion,
      camara.fotosPreview
    );
    if (errPublicacion) {
      setError(errPublicacion.error);
      setPaso(errPublicacion.paso);
      return;
    }

    const borrador = armarBorradorPerdida(
      new FormData(form),
      ubicacion!,
      direccion,
      camara.fotosPreview
    );

    if ("error" in borrador) {
      setError(borrador.error);
      return;
    }

    if (!sesionActiva) {
      solicitarLoginParaPublicar({
        guardarBorrador: () => guardarBorradorPerdida(borrador),
        marcarPendienteStorage: marcarPerdidaPendienteAuth,
        setFlagContexto: setPerdidaPendienteAuth,
        mensajeErrorGuardado: MENSAJE_ERROR_GUARDADO_PERDIDA,
      });
      return;
    }

    setCargando(true);
    const resultado = await publicarReportePerdida(borrador);
    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setExito(resultado.mensaje);
    setMetaExito({ slug: resultado.slug });
    camara.limpiarFotos();
    limpiarUbicacion();
    router.refresh();
  }

  if (exito) {
    return (
      <PanelExitoReporte
        tipo="report"
        titulo="Alerta activada"
        subtitulo="Tu mascota ya aparece como perdida en el mapa y en su página pública."
        tituloExito="¡Alerta publicada!"
        mensaje={exito}
        onVerMapa={verMapaYCerrar}
        onCerrar={cerrarModal}
      >
        {slugExito && (
          <>
            <Link
              href={`/mascota/${slugExito}`}
              className="submit-btn submit-btn-blue"
              onClick={cerrarModal}
            >
              Ver página pública
            </Link>
            <button
              type="button"
              className="submit-btn submit-btn-blue"
              onClick={() => abrirCompartirWhatsAppAlerta(slugExito)}
            >
              Compartir en WhatsApp
            </button>
          </>
        )}
      </PanelExitoReporte>
    );
  }

  return (
    <ShellModalReporte
      tipo="report"
      publicando={publicando}
      mensajePublicando="Activando alerta de búsqueda…"
      titulo="Perdí mi mascota"
      subtitulo={
        <>
          {paso === 1 &&
            "Cuéntanos lo esencial: nombre, foto y dónde se perdió. La comunidad podrá ayudarte en minutos."}
          {paso === 2 &&
            "Un poco más de detalle ayuda a quien la vea en la calle a reconocerla."}
          {paso === 3 &&
            "Tu contacto aparece en la página pública para que puedan escribirte."}
        </>
      }
    >
      <FormularioWizardReporte
        formRef={formRef}
        onSubmit={enviar}
        avisoBorrador={avisoBorrador}
        error={error}
        pasos={PASOS_WIZARD_PERDIDA}
        pasoActivo={paso}
        etiquetaPasos="Progreso del reporte"
      >
        <FormularioDatosMascota
          key={claveFormulario}
          valoresIniciales={valoresFicha}
          pasoActivo={paso as 1 | 2 | 3}
        />

        <div className={clasePasoWizardVisible(paso, 1)}>
          <PasoUbicacionFotosPerdida
            ubicacion={ubicacion}
            onUbicacionChange={setUbicacion}
            direccion={direccion}
            onDireccionChange={setDireccion}
            referenciasZona={referenciasZona}
            onReferenciasZonaChange={setReferenciasZona}
            camara={camara}
          />
        </div>

        <div className={clasePasoWizardVisible(paso, 3)}>
          <PasoContactoPerdida
            contactoNombre={contactoNombre}
            onContactoNombreChange={setContactoNombre}
            contactoTelefono={contactoTelefono}
            onContactoTelefonoChange={setContactoTelefono}
            contactoEmail={contactoEmail}
            onContactoEmailChange={setContactoEmail}
            recompensa={recompensa}
            onRecompensaChange={setRecompensa}
            nombreSesion={sesion?.user?.name}
            emailSesion={sesion?.user?.email}
          />
        </div>

        <AvisoLoginAntesPublicar
          visible={paso === 3 && !sesionActiva}
          mensaje={AVISO_LOGIN_REPORTE_PERDIDA}
        />

        <AccionesWizardReporteConIcono
          paso={paso}
          pasoFinal={pasoFinal}
          publicando={publicando}
          irAtras={irAtras}
          textoCargando="Activando alerta…"
          textoEnviar="Activar alerta de búsqueda"
          iconoEnviar="alerta"
        />
      </FormularioWizardReporte>
    </ShellModalReporte>
  );
}
