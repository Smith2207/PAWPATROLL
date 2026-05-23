import { FormularioRecuperarContrasena } from "@/componentes/auth/FormularioRecuperarContrasena";

export default function PaginaRecuperarContrasena() {
  return (
    <div className="auth-pagina">
      <div className="auth-card">
        <h1>🔑 Recuperar contraseña</h1>
        <FormularioRecuperarContrasena />
      </div>
    </div>
  );
}
