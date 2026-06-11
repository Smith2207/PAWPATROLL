"use client";



/**
 * [landing] Modal: reportar perdida.
 */
/**
 * [landing] Modal: reportar perdida.
 */
import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ModalContenedor } from "@/componentes/landing/modales/ModalContenedor";
import { FormularioFotosMascota } from "@/componentes/landing/modales/FormularioFotosMascota";
import { AccionesWizardReporteConIcono } from "@/componentes/landing/modales/ui/AccionesWizardReporte";
import { AvisoLoginAntesPublicar } from "@/componentes/landing/modales/ui/AvisoLoginAntesPublicar";
import { EncabezadoModalReporte } from "@/componentes/landing/modales/ui/EncabezadoModalReporte";
import { FormularioWizardReporte } from "@/componentes/landing/modales/ui/FormularioWizardReporte";
import { SeccionUbicacionReporte } from "@/componentes/landing/modales/ui/SeccionUbicacionReporte";
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
  extraerRecompensa,
  validarPaso1Perdida,
  validarPaso2Perdida,
} from "@/lib/perdidas/formulario-borrador";
import { publicarReportePerdida } from "@/lib/perdidas/publicar-reporte";
import {
  MSG_UBICACION_CORTA_PERDIDA,
  errorSiSinUbicacion,
} from "@/lib/reportes/validaciones";
import {
  FormularioDatosMascota,
  type ValoresInicialesFichaMascota,
} from "@/componentes/landing/modales/FormularioDatosMascota";
import { OverlayPublicando } from "@/componentes/ui/OverlayPublicando";
import { PanelExitoReporte } from "@/componentes/landing/modales/PanelExitoReporte";

const PASOS_PERDIDA = [
  { id: 1, titulo: "Lo esencial" },
  { id: 2, titulo: "Detalles" },
  { id: 3, titulo: "Contacto" },
] as const;

const AVISO_LOGIN =
  "Al activar la alerta, guardaremos tu reporte y te pediremos iniciar sesión para publicarlo de forma segura.";

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

    const { descripcion, recompensa: recomp } = extraerRecompensa(
      borrador.datosMascota.descripcion
    );

    setValoresFicha({
      nombre: borrador.datosMascota.nombre,
      tipo: borrador.datosMascota.tipo,
      raza: borrador.datosMascota.raza,
      sexo: borrador.datosMascota.sexo ?? "",
      color: borrador.datosMascota.color ?? "",
      tamano: borrador.datosMascota.tamano ?? "",
      edad: borrador.datosMascota.edad ?? "",
      accesoExterior: borrador.datosMascota.accesoExterior ?? "",
      descripcion,
      fechaPerdida: borrador.perdida.fechaPerdida,
    });
    setUbicacion({
      lat: borrador.perdida.latPerdida,
      lng: borrador.perdida.lngPerdida,
    });
    const partesLugar = borrador.perdida.lugarPerdida.split(" · ");
    setDireccion(partesLugar[0] ?? "");
    setReferenciasZona(
      borrador.referenciasZona ?? borrador.perdida.notas ?? partesLugar[1] ?? ""
    );
    setContactoNombre(borrador.contactoNombre ?? "");
    setContactoTelefono(borrador.contactoTelefono ?? "");
    setContactoEmail(borrador.contactoEmail ?? "");
    setRecompensa(borrador.recompensa ?? recomp);
    camara.establecerFotos(borrador.fotos);
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
      if (paso === 1) {
        irSiguiente(() =>
          validarPaso1Perdida(form, ubicacion, camara.fotosPreview)
        );
      } else if (paso === 2) {
        irSiguiente(() => validarPaso2Perdida(form));
      } else {
        irSiguiente();
      }
      return;
    }

    const err1 = validarPaso1Perdida(form, ubicacion, camara.fotosPreview);
    if (err1) {
      setError(err1);
      setPaso(1);
      return;
    }

    const err2 = validarPaso2Perdida(form);
    if (err2) {
      setError(err2);
      setPaso(2);
      return;
    }

    const errUbicacion = errorSiSinUbicacion(
      ubicacion,
      MSG_UBICACION_CORTA_PERDIDA
    );
    if (errUbicacion) {
      setError(errUbicacion);
      setPaso(1);
      return;
    }

    const fd = new FormData(form);
    const borrador = armarBorradorPerdida(
      fd,
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
        mensajeErrorGuardado:
          "No se pudo guardar el reporte (las fotos pueden ser muy pesadas). Prueba con imágenes más pequeñas.",
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

  function compartirWhatsApp() {
    if (!slugExito || typeof window === "undefined") return;
    const url = `${window.location.origin}/mascota/${slugExito}`;
    const texto = encodeURIComponent(
      `Ayúdame a encontrar a mi mascota. Mira la alerta en PawPatrol: ${url}`
    );
    window.open(`https://wa.me/?text=${texto}`, "_blank", "noopener,noreferrer");
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
              onClick={compartirWhatsApp}
            >
              Compartir en WhatsApp
            </button>
          </>
        )}
      </PanelExitoReporte>
    );
  }

  return (
    <ModalContenedor tipo="report">
      <OverlayPublicando
        visible={publicando}
        mensaje="Activando alerta de búsqueda…"
      />
      <EncabezadoModalReporte
        tipo="report"
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
      />
      <FormularioWizardReporte
        formRef={formRef}
        onSubmit={enviar}
        avisoBorrador={avisoBorrador}
        error={error}
        pasos={PASOS_PERDIDA}
        pasoActivo={paso}
        etiquetaPasos="Progreso del reporte"
      >
        <FormularioDatosMascota
          key={claveFormulario}
          valoresIniciales={valoresFicha}
          pasoActivo={paso as 1 | 2 | 3}
        />

        <div className={paso === 1 ? "" : "pp-wizard-oculto"}>
          <SeccionUbicacionReporte
            tituloSeccion="Ubicación donde se perdió"
            etiqueta="¿Dónde se perdió? *"
            idInput="report-location"
            icono="ubicacion"
            valor={ubicacion}
            onChange={setUbicacion}
            direccion={direccion}
            onDireccionChange={setDireccion}
          >
            <div className="form-group">
              <label htmlFor="referenciasZona">
                Referencias adicionales de la zona
              </label>
              <input
                id="referenciasZona"
                name="referenciasZona"
                type="text"
                placeholder="Ej: Cerca al mercado, frente al parque..."
                value={referenciasZona}
                onChange={(e) => setReferenciasZona(e.target.value)}
              />
            </div>
          </SeccionUbicacionReporte>
          <FormularioFotosMascota camara={camara} />
        </div>

        <div className={paso === 3 ? "" : "pp-wizard-oculto"}>
          <div className="section-divider">Datos de contacto en la página pública</div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactoNombre">Tu nombre</label>
              <input
                id="contactoNombre"
                name="contactoNombre"
                type="text"
                placeholder="Nombre del dueño"
                value={contactoNombre || sesion?.user?.name || ""}
                onChange={(e) => setContactoNombre(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="contactoTelefono">
                Teléfono (público en la página)
              </label>
              <input
                id="contactoTelefono"
                name="contactoTelefono"
                type="tel"
                placeholder="+51 999 999 999"
                value={contactoTelefono}
                onChange={(e) => setContactoTelefono(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="contactoEmail">Correo (público en la página)</label>
            <input
              id="contactoEmail"
              name="contactoEmail"
              type="email"
              placeholder="tucorreo@ejemplo.com"
              value={contactoEmail || sesion?.user?.email || ""}
              onChange={(e) => setContactoEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="recompensa">¿Ofrece recompensa?</label>
            <input
              id="recompensa"
              name="recompensa"
              type="text"
              placeholder="Ej: S/. 200 a quien lo encuentre (opcional)"
              value={recompensa}
              onChange={(e) => setRecompensa(e.target.value)}
            />
          </div>
        </div>

        <AvisoLoginAntesPublicar
          visible={paso === 3 && !sesionActiva}
          mensaje={AVISO_LOGIN}
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
    </ModalContenedor>
  );
}
