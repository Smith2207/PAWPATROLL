import { FormularioInicioSesion } from "@/componentes/auth/FormularioInicioSesion";
import Link from "next/link";
import { Suspense } from "react";
import "@/estilos/auth.css";

export default function PaginaIniciarSesion() {
  return (
    <div className="auth-pagina">
      <div className="auth-card">
        <h1>👋 Iniciar sesión</h1>
        <p className="auth-sub">
          Accede con Google o con tu correo y contraseña verificados.
        </p>
        <Suspense>
          <FormularioInicioSesion />
        </Suspense>
        <p className="auth-enlace" style={{ marginTop: "1.5rem" }}>
          <Link href="/">← Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
