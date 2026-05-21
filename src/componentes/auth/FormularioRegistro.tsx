"use client";

import { registrarUsuario } from "@/actions/autenticacion";
import type { RolUsuario } from "@/lib/db/schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function FormularioRegistro() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<RolUsuario>("CIUDADANO");
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
      rol,
    });

    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setMensaje(resultado.mensaje);
    router.push("/iniciar-sesion?registrado=1");
  }

  return (
    <div className="auth-pagina">
      <div className="auth-card">
        <h1>🐾 Crear cuenta</h1>
        <p className="auth-sub">
          Registro con correo y contraseña. Verifica tu email para activar la
          cuenta.
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
          <div className="form-group">
            <label>Tipo de cuenta *</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as RolUsuario)}
            >
              <option value="CIUDADANO">Ciudadano — reportar avistamientos</option>
              <option value="DUENO">Dueño — registrar mis mascotas</option>
            </select>
            <p className="auth-ayuda">
              El rol Administrador solo lo asigna un administrador del sistema.
            </p>
          </div>
          <button type="submit" disabled={cargando} className="submit-btn">
            {cargando ? "Creando cuenta..." : "Registrarme"}
          </button>
        </form>

        <p className="auth-enlace">
          ¿Ya tienes cuenta?{" "}
          <Link href="/iniciar-sesion">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
