"use client";

import { registrarUsuario } from "@/actions/autenticacion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function FormularioRegistro() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setMensaje(null);

    const resultado = await registrarUsuario({
      nombre,
      email,
      password,
    });

    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setMensaje(resultado.mensaje);
    const correo = encodeURIComponent(email.trim().toLowerCase());
    router.push(`/verificar-correo?pendiente=1&email=${correo}`);
  }

  return (
    <div className="auth-pagina">
      <div className="auth-card">
        <h1>🐾 Crear cuenta</h1>
        <p className="auth-sub">
          Con tu cuenta puedes reportar mascotas perdidas, registrar avistamientos
          y guardar el perfil de tus mascotas. Con correo y contraseña debes
          verificar tu email antes de entrar.
        </p>
        <p className="auth-ayuda" style={{ marginBottom: "1rem" }}>
          ¿Prefieres Google?{" "}
          <Link href="/?login=1">Inicia sesión aquí</Link> — no necesitas
          este formulario.
        </p>

        {error && <p className="auth-alerta auth-alerta--error">{error}</p>}
        {mensaje && <p className="auth-alerta auth-alerta--ok">{mensaje}</p>}

        <form onSubmit={enviar}>
          <div className="form-group">
            <label>Nombre completo *</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>
          <div className="form-group">
            <label>Correo electrónico *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
            />
          </div>
          <div className="form-group">
            <label>Contraseña * (mín. 8 caracteres)</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={cargando} className="submit-btn">
            {cargando ? "Creando cuenta..." : "Registrarme"}
          </button>
        </form>

        <p className="auth-enlace">
          ¿Ya tienes cuenta?{" "}
          <Link href="/?login=1">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
