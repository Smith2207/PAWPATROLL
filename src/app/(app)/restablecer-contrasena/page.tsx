/**
 * Ruta /restablecer-contrasena. Página principal de la ruta.
 */
import { FormularioRestablecerContrasena } from "@/componentes/auth/FormularioRestablecerContrasena";
import { Icono } from "@/componentes/ui/Icono";
import { validarTokenRecuperacion } from "@/lib/auth/recuperar-contrasena";

type Props = {
  searchParams: Promise<{
    email?: string;
    token?: string;
  }>;
};

export default async function PaginaRestablecerContrasena({
  searchParams,
}: Props) {
  const params = await searchParams;
  const email = params.email ? decodeURIComponent(params.email) : "";
  const token = params.token?.trim() ?? "";

  let tokenInvalido = false;
  let motivoError: string | undefined;

  if (email && token) {
    const validacion = await validarTokenRecuperacion(email, token);
    if (!validacion.ok) {
      tokenInvalido = true;
      motivoError = validacion.error;
    }
  } else {
    tokenInvalido = true;
    motivoError = "Falta el enlace completo del correo.";
  }

  return (
    <div className="auth-pagina">
      <div className="auth-card">
        <h1>
          <Icono nombre="candado" size={22} className="pp-icon--btn" />
          Nueva contraseña
        </h1>
        <FormularioRestablecerContrasena
          email={email}
          token={token}
          tokenInvalido={tokenInvalido}
          motivoError={motivoError}
        />
      </div>
    </div>
  );
}
