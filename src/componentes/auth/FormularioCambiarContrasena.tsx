"use client";

import { cambiarContrasenaSesion } from "@/actions/autenticacion";
import { CampoContrasena } from "@/componentes/auth/CampoContrasena";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icono } from "@/componentes/ui/Icono";

type Props = {
  email: string;
};

export function FormularioCambiarContrasena({ email }: Props) {
  const router = useRouter();
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMensaje(null);

    if (password.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== password2) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setCargando(true);
    const resultado = await cambiarContrasenaSesion({
      contrasenaActual,
      password,
    });
    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setMensaje(resultado.mensaje);
    setContrasenaActual("");
    setPassword("");
    setPassword2("");
    router.refresh();
  }

  return (
    <form onSubmit={guardar} className="perfil-formulario">
      {mensaje && <p className="auth-alerta auth-alerta--ok">{mensaje}</p>}
      {error && <p className="auth-alerta auth-alerta--error">{error}</p>}

      <div className="form-group">
        <label htmlFor="cambiar-correo">Correo de tu cuenta</label>
        <input
          id="cambiar-correo"
          type="email"
          value={email}
          readOnly
          className="perfil-input-solo-lectura"
          aria-readonly="true"
        />
        <p className="perfil-campo-ayuda">
          Usamos el correo con el que iniciaste sesión.
        </p>
      </div>

      <CampoContrasena
        id="cambiar-actual"
        label="Contraseña actual"
        value={contrasenaActual}
        onChange={setContrasenaActual}
        autoComplete="current-password"
        placeholder="Tu contraseña actual"
      />

      <CampoContrasena
        id="cambiar-nueva"
        label="Nueva contraseña"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
      />

      <CampoContrasena
        id="cambiar-nueva2"
        label="Confirmar nueva contraseña"
        value={password2}
        onChange={setPassword2}
        autoComplete="new-password"
        placeholder="Repite la nueva contraseña"
      />

      <div className="perfil-formulario-acciones">
        <button type="submit" disabled={cargando} className="submit-btn">
          {cargando ? "Guardando..." : "Guardar nueva contraseña"}
        </button>
        <Link href="/perfil" className="perfil-enlace pp-enlace-icono">
          <Icono nombre="izquierda" size={14} />
          Volver a mi perfil
        </Link>
      </div>
    </form>
  );
}
