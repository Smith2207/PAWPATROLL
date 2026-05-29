"use client";

import { useEffect, useState } from "react";
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
import Link from "next/link";

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
    return { error: "Indica si tu mascota sale al exterior (afina el cerco de búsqueda)." };
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
    if (modalAbierto !== "report") return;

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
    setError(null);
    setExito(null);
  }, [modalAbierto]);

  const publicando = publicandoReporte === "perdida" || cargando;

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setExito(null);
    setSlugExito(null);

    if (status === "loading") return;

    if (!coordenadasValidas(ubicacion)) {
      setError(
        "Indica dónde se perdió: busca la dirección, usa Ubicarme o marca el mapa."
      );
      return;
    }

    const fd = new FormData(e.currentTarget);
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
    document.getElementById("mapa")?.scrollIntoView({ behavior: "smooth" });
  }

  if (exito) {
    return (
      <ModalContenedor tipo="report">
        <div className="modal-header">
          <div className="modal-header-accent" />
          <BotonCerrarModal tipo="report" />
          <div className="modal-title">Alerta activada</div>
          <div className="modal-sub">
            Tu mascota ya aparece como perdida en el mapa y en su ficha pública.
          </div>
        </div>
        <div className="modal-body pp-avistamiento-exito-panel">
          <div className="pp-avistamiento-exito" role="status">
            <span className="pp-avistamiento-exito-icono" aria-hidden>
              ✅
            </span>
            <div>
              <strong>¡Alerta publicada!</strong>
              <p>{exito}</p>
            </div>
          </div>
          {slugExito && (
            <Link
              href={`/mascota/${slugExito}`}
              className="submit-btn submit-btn-blue"
              onClick={() => cerrarModal("report")}
            >
              Ver ficha pública
            </Link>
          )}
          <button
            type="button"
            className="submit-btn"
            onClick={verMapaYCerrar}
          >
            🗺️ Ver en el mapa
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
        <div className="modal-title">Perdí a mi mascota</div>
        <div className="modal-sub">
          Completa la ficha y la ubicación. Al final te pediremos iniciar sesión
          o crear una cuenta para activar la alerta de forma segura. También
          puedes hacerlo con más detalle en{" "}
          <a href="/mis-mascotas/ficha" className="modal-enlace-inline">
            Mis fichas
          </a>
          .
        </div>
      </div>
      <form className="modal-body" onSubmit={enviar}>
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

        <FormularioDatosMascota
          key={claveFormulario}
          valoresIniciales={valoresFicha}
        />

        <div className="section-divider">📍 Ubicación donde se perdió</div>

        <SelectorUbicacionMapa
          etiqueta="¿Dónde se perdió? *"
          idInput="report-location"
          icono="📍"
          placeholder={PLACEHOLDER_UBICACION}
          valor={ubicacion}
          onChange={setUbicacion}
          direccionTexto={direccion}
          onDireccionChange={setDireccion}
        />

        <div className="form-group">
          <label htmlFor="referenciasZona">Referencias adicionales de la zona</label>
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

        <div className="section-divider">Datos de contacto en la ficha</div>

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
            <label htmlFor="contactoTelefono">Teléfono (público en ficha)</label>
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
          <label htmlFor="contactoEmail">Correo (público en ficha)</label>
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

        {!sesionActiva && (
          <p className="auth-alerta auth-alerta--info" role="note">
            Al continuar, tu alerta quedará guardada y te pediremos iniciar sesión
            o registrarte para publicarla.
          </p>
        )}

        <button type="submit" className="submit-btn" disabled={publicando}>
          {publicando ? "Activando alerta…" : "🚨 Activar alerta de búsqueda"}
        </button>
      </form>
    </ModalContenedor>
  );
}
