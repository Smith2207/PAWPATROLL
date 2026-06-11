"use client";



/**
 * [auth] Formulario: reenviar verificacion.
 */
/**
 * [auth] Formulario: reenviar verificacion.
 */
import { reenviarCorreoVerificacion } from "@/actions/autenticacion";
import { useState } from "react";

type Props = {
  emailInicial?: string;
};

export function FormularioReenviarVerificacion({ emailInicial = "" }: Props) {
  const [email, setEmail] = useState(emailInicial);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setMensaje(null);

    const resultado = await reenviarCorreoVerificacion(email);
    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setMensaje(resultado.mensaje);
  }

  return (
    <form onSubmit={enviar} style={{ marginTop: "1.25rem" }}>
      <div className="form-group">
        <label>Correo de tu cuenta</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@ejemplo.com"
        />
      </div>
      {error && (
        <p className="auth-alerta auth-alerta--error" style={{ marginTop: "0.75rem" }}>
          {error}
        </p>
      )}
      {mensaje && (
        <p className="auth-alerta auth-alerta--ok" style={{ marginTop: "0.75rem" }}>
          {mensaje}
        </p>
      )}
      <button
        type="submit"
        disabled={cargando}
        className="submit-btn"
        style={{ marginTop: "0.75rem" }}
      >
        {cargando ? "Enviando..." : "Reenviar correo de verificación"}
      </button>
    </form>
  );
}
