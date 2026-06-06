"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BotonCerrarModal,
  ModalContenedor,
} from "@/componentes/landing/modales/ModalContenedor";
import { FormularioFotosMascota } from "@/componentes/landing/modales/FormularioFotosMascota";
import { SelectorUbicacionMapa } from "@/componentes/landing/ui/SelectorUbicacionMapa";
import { PLACEHOLDER_UBICACION } from "@/lib/mascotas/catalogos";
import type { UbicacionSeleccionada } from "@/lib/geo/tipos";
import { coordenadasValidas } from "@/lib/geo/tipos";
import { etiquetaVisibleUbicacion } from "@/lib/geo/etiqueta-ubicacion";
import { useModales } from "@/contexto/ContextoModales";
import { useCamaraReporte } from "@/hooks/useCamaraReporte";
import type { DatosFichaMascota } from "@/lib/db/schema";
import {
  guardarBorradorPerdida,
  leerBorradorPerdida,
  leerYQuitarExitoPerdida,
  marcarPerdidaPendienteAuth,
  type BorradorReportePerdida,
} from "@/lib/perdidas/borrador-cliente";
import { publicarReportePerdida } from "@/lib/perdidas/publicar-reporte";
import {
  FormularioDatosMascota,
  type ValoresInicialesFichaMascota,
} from "@/componentes/landing/modales/FormularioDatosMascota";
import { OverlayPublicando } from "@/componentes/ui/OverlayPublicando";
import { Icono } from "@/componentes/ui/Icono";
import Link from "next/link";
import { RUTAS_LANDING } from "@/lib/landing/rutas";

const PASOS_PERDIDA = [
  { id: 1, titulo: "Lo esencial" },
  { id: 2, titulo: "Detalles" },
  { id: 3, titulo: "Contacto" },
] as const;

function validarPaso1(
  form: HTMLFormElement,
  ubicacion: UbicacionSeleccionada | null,
  fotos: string[]
): string | null {
  const nombre = form.elements.namedItem("nombre");
  const nombreVal =
    nombre instanceof HTMLInputElement ? nombre.value.trim() : "";
  if (!nombreVal) return "Escribe el nombre de tu mascota.";

  const tipo = form.elements.namedItem("tipo");
  const tipoVal = tipo instanceof HTMLSelectElement ? tipo.value : "";
  if (!tipoVal) return "Indica si es perro o gato.";

  if (!coordenadasValidas(ubicacion)) {
    return "Marca en el mapa dónde se perdió (busca la dirección o usa Ubicarme).";
  }

  if (fotos.length === 0) {
    return "Sube al menos una foto de tu mascota.";
  }

  return null;
}

function validarPaso2(form: HTMLFormElement): string | null {
  const acceso = form.elements.namedItem("accesoExterior");
  const accesoVal =
    acceso instanceof HTMLSelectElement ? acceso.value : "";
  if (!accesoVal) {
    return "Indica si tu mascota suele salir sola al exterior.";
  }

  const fecha = form.elements.namedItem("fechaPerdida");
  const fechaVal = fecha instanceof HTMLInputElement ? fecha.value : "";
  if (!fechaVal) return "Indica cuándo se perdió.";

  return null;
}

function armarBorradorDesdeFormulario(
  fd: FormData,
  ubicacion: UbicacionSeleccionada,
  direccion: string,
  fotos: string[]
): BorradorReportePerdida | { error: string } {
  const nombre = fd.get("nombre")?.toString() ?? "";
  const tipo = fd.get("tipo")?.toString() ?? "";
  const referencias = fd.get("referenciasZona")?.toString().trim();
  const contactoNombre = fd.get("contactoNombre")?.toString().trim();
  const contactoTel = fd.get("contactoTelefono")?.toString().trim();
  const contactoEmail = fd.get("contactoEmail")?.toString().trim();
  const recompensa = fd.get("recompensa")?.toString().trim();

  const lugarBase =
    direccion.trim() ||
    etiquetaVisibleUbicacion(ubicacion) ||
    "Zona reportada";
  const lugarPerdida = referencias
    ? `${lugarBase} · ${referencias}`
    : lugarBase;

  let descripcion = fd.get("descripcion")?.toString().trim() || "";
  if (recompensa) {
    descripcion = descripcion
      ? `${descripcion}\n\nRecompensa: ${recompensa}`
      : `Recompensa: ${recompensa}`;
  }

  const partesContacto = [contactoNombre, contactoTel, contactoEmail].filter(
    Boolean
  );
  const contactoPublico =
    partesContacto.length > 0 ? partesContacto.join(" · ") : undefined;

  if (fotos.length === 0) {
    return { error: "Sube al menos una foto de tu mascota." };
  }

  const acceso = fd.get("accesoExterior")?.toString();
  if (!acceso) {
    return { error: "Indica si tu mascota suele salir sola al exterior." };
  }

  const datosMascota: DatosFichaMascota = {
    nombre,
    tipo,
    raza: fd.get("raza")?.toString(),
    sexo: fd.get("sexo")?.toString(),
    color: fd.get("color")?.toString(),
    tamano: fd.get("tamano")?.toString(),
    edad: fd.get("edad")?.toString(),
    accesoExterior: fd.get("accesoExterior")?.toString(),
    descripcion: descripcion || undefined,
    contactoPublico,
  };

  return {
    datosMascota,
    fotos,
    perdida: {
      lugarPerdida,
      fechaPerdida: fd.get("fechaPerdida")?.toString(),
      latPerdida: ubicacion.lat,
      lngPerdida: ubicacion.lng,
      notas: referencias || undefined,
    },
    guardadoEn: new Date().toISOString(),
    referenciasZona: referencias || undefined,
    contactoNombre: contactoNombre || undefined,
    contactoTelefono: contactoTel || undefined,
    contactoEmail: contactoEmail || undefined,
    recompensa: recompensa || undefined,
  };
}

function extraerRecompensa(descripcion?: string | null): {
  descripcion: string;
  recompensa: string;
} {
  if (!descripcion) return { descripcion: "", recompensa: "" };
  const idx = descripcion.indexOf("\n\nRecompensa: ");
  if (idx === -1) {
    if (descripcion.startsWith("Recompensa: ")) {
      return { descripcion: "", recompensa: descripcion.slice(12) };
    }
    return { descripcion, recompensa: "" };
  }
  return {
    descripcion: descripcion.slice(0, idx),
    recompensa: descripcion.slice(idx + 14),
  };
}

export function ModalReportarPerdida() {
  const { data: sesion, status } = useSession();
  const {
    abrirModal,
    cerrarModal,
    setPerdidaPendienteAuth,
    modalAbierto,
    publicandoReporte,
  } = useModales();
  const router = useRouter();
  const camara = useCamaraReporte({ idPrefijo: "reporte-perdida" });
  const sesionActiva = status === "authenticated";

  const [ubicacion, setUbicacion] = useState<UbicacionSeleccionada | null>(null);
  const [direccion, setDireccion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [slugExito, setSlugExito] = useState<string | null>(null);
  const [valoresFicha, setValoresFicha] = useState<
    ValoresInicialesFichaMascota | undefined
  >(undefined);
  const [referenciasZona, setReferenciasZona] = useState("");
  const [contactoNombre, setContactoNombre] = useState("");
  const [contactoTelefono, setContactoTelefono] = useState("");
  const [contactoEmail, setContactoEmail] = useState("");
  const [recompensa, setRecompensa] = useState("");
  const [claveFormulario, setClaveFormulario] = useState(0);
  const [avisoBorrador, setAvisoBorrador] = useState(false);
  const [paso, setPaso] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);

  function aplicarResultadoPublicacion() {
    const resultado = leerYQuitarExitoPerdida();
    if (!resultado) return false;
    if (resultado.slug) {
      setExito(resultado.mensaje);
      setSlugExito(resultado.slug);
      setError(null);
      setAvisoBorrador(false);
    } else {
      setExito(null);
      setSlugExito(null);
      setError(resultado.mensaje);
    }
    return true;
  }

  useEffect(() => {
    const onPublicado = () => aplicarResultadoPublicacion();
    window.addEventListener("pawpatroll:reporte-publicado", onPublicado);
    return () =>
      window.removeEventListener("pawpatroll:reporte-publicado", onPublicado);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      if (modalAbierto !== "report") {
        setPaso(1);
        return;
      }

      if (aplicarResultadoPublicacion()) return;

      const borrador = leerBorradorPerdida();
      if (!borrador) return;

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
        descripcion: descripcion,
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
      setAvisoBorrador(true);
      setPaso(1);
      setError(null);
      setExito(null);
    });
  }, [modalAbierto]);

  const publicando = publicandoReporte === "perdida" || cargando;

  function irAtras() {
    setError(null);
    setPaso((p) => Math.max(1, p - 1));
  }

  function irSiguiente() {
    const form = formRef.current;
    if (!form) return;

    if (paso === 1) {
      const err = validarPaso1(form, ubicacion, camara.fotosPreview);
      if (err) {
        setError(err);
        return;
      }
    }

    if (paso === 2) {
      const err = validarPaso2(form);
      if (err) {
        setError(err);
        return;
      }
    }

    setError(null);
    setPaso((p) => Math.min(3, p + 1));
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setExito(null);
    setSlugExito(null);

    if (status === "loading") return;

    const form = e.currentTarget;

    if (paso < 3) {
      irSiguiente();
      return;
    }

    const err1 = validarPaso1(form, ubicacion, camara.fotosPreview);
    if (err1) {
      setError(err1);
      setPaso(1);
      return;
    }

    const err2 = validarPaso2(form);
    if (err2) {
      setError(err2);
      setPaso(2);
      return;
    }

    if (!coordenadasValidas(ubicacion)) {
      setError("Marca en el mapa dónde se perdió.");
      setPaso(1);
      return;
    }

    const fd = new FormData(form);
    const borrador = armarBorradorDesdeFormulario(
      fd,
      ubicacion,
      direccion,
      camara.fotosPreview
    );

    if ("error" in borrador) {
      setError(borrador.error);
      return;
    }

    if (!sesionActiva) {
      const guardado = guardarBorradorPerdida(borrador);
      if (!guardado) {
        setError(
          "No se pudo guardar el reporte (las fotos pueden ser muy pesadas). Prueba con imágenes más pequeñas."
        );
        return;
      }
      marcarPerdidaPendienteAuth();
      setPerdidaPendienteAuth(true);
      abrirModal("login");
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
    setSlugExito(resultado.slug ?? null);
    camara.limpiarFotos();
    setUbicacion(null);
    setDireccion("");
    router.refresh();
  }

  function verMapaYCerrar() {
    cerrarModal("report");
    router.push(`${RUTAS_LANDING.comunidad}#mapa`);
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
      <ModalContenedor tipo="report">
        <div className="modal-header">
          <div className="modal-header-accent" />
          <BotonCerrarModal tipo="report" />
          <div className="modal-title">Alerta activada</div>
          <div className="modal-sub">
            Tu mascota ya aparece como perdida en el mapa y en su página pública.
          </div>
        </div>
        <div className="modal-body pp-avistamiento-exito-panel">
          <div className="pp-avistamiento-exito" role="status">
            <span className="pp-avistamiento-exito-icono">
              <Icono nombre="checkCirculo" size={28} />
            </span>
            <div>
              <strong>¡Alerta publicada!</strong>
              <p>{exito}</p>
            </div>
          </div>
          {slugExito && (
            <>
              <Link
                href={`/mascota/${slugExito}`}
                className="submit-btn submit-btn-blue"
                onClick={() => cerrarModal("report")}
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
          <button
            type="button"
            className="submit-btn"
            onClick={verMapaYCerrar}
          >
            <Icono nombre="mapa" size={18} className="pp-icon--btn" /> Ver en el mapa
          </button>
          <button
            type="button"
            className="submit-btn"
            onClick={() => cerrarModal("report")}
          >
            Cerrar
          </button>
        </div>
      </ModalContenedor>
    );
  }

  return (
    <ModalContenedor tipo="report">
      <OverlayPublicando
        visible={publicando}
        mensaje="Activando alerta de búsqueda…"
      />
      <div className="modal-header">
        <div className="modal-header-accent" />
        <BotonCerrarModal tipo="report" />
        <div className="modal-title">Perdí mi mascota</div>
        <div className="modal-sub">
          {paso === 1 &&
            "Cuéntanos lo esencial: nombre, foto y dónde se perdió. La comunidad podrá ayudarte en minutos."}
          {paso === 2 &&
            "Un poco más de detalle ayuda a quien la vea en la calle a reconocerla."}
          {paso === 3 &&
            "Tu contacto aparece en la página pública para que puedan escribirte."}
        </div>
      </div>
      <form ref={formRef} className="modal-body" noValidate onSubmit={enviar}>
        {avisoBorrador && (
          <p className="auth-alerta auth-alerta--info" role="status">
            Recuperamos tu borrador. Revisa los datos y continúa para publicar.
          </p>
        )}
        {error && (
          <p className="auth-alerta auth-alerta--error" role="alert">
            {error}
          </p>
        )}

        <div className="auth-pasos" aria-label="Progreso del reporte">
          {PASOS_PERDIDA.map((p) => (
            <div
              key={p.id}
              className={`auth-paso ${paso === p.id ? "auth-paso--activo" : ""} ${paso > p.id ? "auth-paso--hecho" : ""}`}
            >
              <span className="auth-paso-num">{p.id}</span>
              <span className="auth-paso-titulo">{p.titulo}</span>
            </div>
          ))}
        </div>

        <FormularioDatosMascota
          key={claveFormulario}
          valoresIniciales={valoresFicha}
          pasoActivo={paso as 1 | 2 | 3}
        />

        <div className={paso === 1 ? "" : "pp-wizard-oculto"}>
          <div className="section-divider">
            <Icono nombre="ubicacion" size={16} className="pp-icon--btn" /> Ubicación donde se perdió
          </div>

          <SelectorUbicacionMapa
            etiqueta="¿Dónde se perdió? *"
            idInput="report-location"
            icono="ubicacion"
            placeholder={PLACEHOLDER_UBICACION}
            valor={ubicacion}
            onChange={setUbicacion}
            direccionTexto={direccion}
            onDireccionChange={setDireccion}
          />

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

        {paso === 3 && !sesionActiva && (
          <p className="auth-alerta auth-alerta--info" role="note">
            Al activar la alerta, guardaremos tu reporte y te pediremos iniciar
            sesión para publicarlo de forma segura.
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
          <button type="submit" className="submit-btn" disabled={publicando}>
            {publicando
              ? "Activando alerta…"
              : paso < 3
                ? "Continuar"
                : (
                  <>
                    <Icono nombre="alerta" size={18} className="pp-icon--btn" /> Activar alerta de búsqueda
                  </>
                )}
          </button>
        </div>
      </form>
    </ModalContenedor>
  );
}
