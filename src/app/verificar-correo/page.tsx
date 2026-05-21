import Link from "next/link";
import "@/estilos/auth.css";

type Props = {
  searchParams: Promise<{ estado?: string; motivo?: string }>;
};

export default async function PaginaVerificarCorreo({ searchParams }: Props) {
  const params = await searchParams;
  const ok = params.estado === "ok";
  const error = params.estado === "error";

  return (
    <div className="auth-pagina">
      <div className="auth-card">
        <h1>📧 Verificación de correo</h1>
        {ok && (
          <p className="auth-alerta auth-alerta--ok">
            Tu correo fue verificado correctamente. Ya puedes iniciar sesión.
          </p>
        )}
        {error && (
          <p className="auth-alerta auth-alerta--error">
            {params.motivo
              ? decodeURIComponent(params.motivo)
              : "No se pudo verificar el correo."}
          </p>
        )}
        {!ok && !error && (
          <p className="auth-sub">
            Revisa tu bandeja de entrada y haz clic en el enlace que te enviamos.
            En desarrollo, el enlace también aparece en la consola del servidor.
          </p>
        )}
        <p className="auth-enlace">
          <Link href="/iniciar-sesion">Ir a iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
