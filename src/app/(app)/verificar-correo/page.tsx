import { FormularioReenviarVerificacion } from "@/componentes/auth/FormularioReenviarVerificacion";
import { Icono } from "@/componentes/ui/Icono";
import Link from "next/link";
type Props = {
  searchParams: Promise<{
    estado?: string;
    motivo?: string;
    pendiente?: string;
    email?: string;
  }>;
};

export default async function PaginaVerificarCorreo({ searchParams }: Props) {
  const params = await searchParams;
  const ok = params.estado === "ok";
  const error = params.estado === "error";
  const pendiente = params.pendiente === "1";
  const email = params.email ? decodeURIComponent(params.email) : "";

  return (
    <div className="auth-pagina">
      <div className="auth-card">
        <h1>
          <Icono nombre="correo" size={22} className="pp-icon--btn" />
          Verificación de correo
        </h1>

        {ok && (
          <p className="auth-alerta auth-alerta--ok">
            Tu correo fue verificado correctamente. Revisa también el mensaje de
            bienvenida y ya puedes iniciar sesión.
          </p>
        )}

        {error && (
          <p className="auth-alerta auth-alerta--error">
            {params.motivo
              ? decodeURIComponent(params.motivo)
              : "No se pudo verificar el correo."}
          </p>
        )}

        {pendiente && !ok && (
          <p className="auth-alerta auth-alerta--ok">
            Cuenta creada. Te enviamos un correo automático desde{" "}
            <strong>paw.patrol.soporte@gmail.com</strong> con un botón de
            verificación (válido 24 h). Revisa también spam.
          </p>
        )}

        {!ok && !error && !pendiente && (
          <p className="auth-sub">
            Revisa tu bandeja (y carpeta spam). El correo llega desde{" "}
            <strong>paw.patrol.soporte@gmail.com</strong>.
          </p>
        )}

        {!ok && (
          <>
            <p className="auth-sub" style={{ marginTop: "1rem" }}>
              ¿No llegó el correo? Puedes pedir otro aquí:
            </p>
            <FormularioReenviarVerificacion emailInicial={email} />
          </>
        )}

        <p className="auth-enlace" style={{ marginTop: "1.5rem" }}>
          <Link href="/?login=1">Ir a iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
