"use client";

import { restablecerContrasenaConToken } from "@/actions/autenticacion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icono } from "@/componentes/ui/Icono";

type Props = {
  email: string;
  token: string;
  tokenInvalido?: boolean;
  motivoError?: string;
};

export function FormularioRestablecerContrasena({
  email,
  token,
  tokenInvalido = false,
  motivoError,
}: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(
    tokenInvalido ? motivoError ?? "Enlace no válido." : null
  );
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    const resultado = await restablecerContrasenaConToken({
      email,
      token,
      password,
    });
    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    router.push("/?login=1&passwordRestablecida=1");
    router.refresh();
  }

  if (tokenInvalido || !email || !token) {
    return (
      <>
        <p className="auth-alerta auth-alerta--error">
          {error ?? "Este enlace no sirve o ya expiró."}
        </p>
        <p className="auth-enlace" style={{ marginTop: "1.25rem" }}>
          <Link href="/recuperar-contrasena">Solicitar un enlace nuevo</Link>
        </p>
        <p className="auth-enlace">
          <Link href="/" className="pp-enlace-icono">
            <Icono nombre="izquierda" size={14} />
            Volver al inicio
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <p className="auth-sub">
        Cuenta: <strong>{email}</strong>
      </p>

      {error && (
        <p className="auth-alerta auth-alerta--error" style={{ marginTop: "1rem" }}>
          {error}
        </p>
      )}

      <form onSubmit={enviar} style={{ marginTop: "1.25rem" }}>
        <div className="form-group">
          <label>Nueva contraseña</label>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <div className="form-group">
          <label>Repetir contraseña</label>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="Repite la contraseña"
          />
        </div>
        <button type="submit" disabled={cargando} className="submit-btn">
          {cargando ? "Guardando..." : "Guardar nueva contraseña"}
        </button>
      </form>

      <p className="auth-enlace" style={{ marginTop: "1.5rem" }}>
        <Link href="/recuperar-contrasena">Pedir otro enlace</Link>
      </p>
    </>
  );
}
