/**
 * Ruta /recuperar-contrasena. Página principal de la ruta.
 */
import { FormularioRecuperarContrasena } from "@/componentes/auth/FormularioRecuperarContrasena";
import { Icono } from "@/componentes/ui/Icono";

export default function PaginaRecuperarContrasena() {
  return (
    <div className="auth-pagina">
      <div className="auth-card">
        <h1>
          <Icono nombre="candado" size={22} className="pp-icon--btn" />
          Recuperar contraseña
        </h1>
        <FormularioRecuperarContrasena />
      </div>
    </div>
  );
}
