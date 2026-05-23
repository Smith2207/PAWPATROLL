"use client";

import { solicitarRecuperacionContrasena } from "@/actions/autenticacion";
import Link from "next/link";
import { useState } from "react";

export function FormularioRecuperarContrasena() {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setMensaje(null);

    const resultado = await solicitarRecuperacionContrasena(email);
    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setEnviado(true);
    setMensaje(resultado.mensaje);
  }

  return (
    <>
      <p className="auth-sub">
        Te enviaremos un enlace a tu correo (válido 1 hora). Solo aplica a cuentas
        registradas con correo y contraseña, no a inicio con Google.
      </p>

      {error && (
        <p className="auth-alerta auth-alerta--error" style={{ marginTop: "1rem" }}>
          {error}
        </p>
      )}
      {mensaje && (
        <p className="auth-alerta auth-alerta--ok" style={{ marginTop: "1rem" }}>
          {mensaje}
        </p>
      )}

      {!enviado ? (
        <form onSubmit={enviar} style={{ marginTop: "1.25rem" }}>
          <div className="form-group">
            <label>Correo de tu cuenta</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
            />
          </div>
          <button type="submit" disabled={cargando} className="submit-btn">
            {cargando ? "Enviando..." : "Enviar enlace de recuperación"}
          </button>
        </form>
      ) : null}

      <p className="auth-enlace" style={{ marginTop: "1.5rem" }}>
        <Link href="/">← Volver al inicio</Link>
      </p>
    </>
  );
}
