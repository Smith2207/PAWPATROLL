"use client";

import { actualizarPerfil } from "@/actions/autenticacion";
import { CampoCiudad } from "@/componentes/formulario/CampoCiudad";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  nombreInicial: string;
  telefonoInicial: string;
  ciudadInicial: string;
  email: string;
  notificacionesEmailInicial?: boolean;
  notificacionesInAppInicial?: boolean;
};

export function FormularioPerfil({
  nombreInicial,
  telefonoInicial,
  ciudadInicial,
  email,
  notificacionesEmailInicial = true,
  notificacionesInAppInicial = true,
}: Props) {
  const router = useRouter();
  const [nombre, setNombre] = useState(nombreInicial);
  const [telefono, setTelefono] = useState(telefonoInicial);
  const [ciudad, setCiudad] = useState(ciudadInicial);
  const [notificacionesEmail, setNotificacionesEmail] = useState(
    notificacionesEmailInicial
  );
  const [notificacionesInApp, setNotificacionesInApp] = useState(
    notificacionesInAppInicial
  );
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setMensaje(null);

    const resultado = await actualizarPerfil({
      nombre,
      telefono,
      ciudad,
      notificacionesEmail,
      notificacionesInApp,
    });

    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setMensaje(resultado.mensaje);
    router.refresh();
  }

  return (
    <form onSubmit={guardar} className="perfil-formulario">
      {mensaje && <p className="auth-alerta auth-alerta--ok">{mensaje}</p>}
      {error && <p className="auth-alerta auth-alerta--error">{error}</p>}

      <div className="form-group">
        <label htmlFor="perfil-nombre">Nombres y Apellidos</label>
        <input
          id="perfil-nombre"
          type="text"
          required
          minLength={2}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: María López García"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="perfil-telefono">Teléfono</label>
          <input
            id="perfil-telefono"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej: 999 888 777"
          />
          <p className="perfil-campo-ayuda">Útil si alguien encuentra a tu mascota.</p>
        </div>
        <CampoCiudad
          id="perfil-ciudad"
          label="Ciudad"
          value={ciudad}
          onChange={setCiudad}
          placeholder="Ej: Juliaca"
        />
      </div>

      <div className="form-group">
        <label htmlFor="perfil-email">Correo electrónico</label>
        <input
          id="perfil-email"
          type="email"
          value={email}
          disabled
          className="perfil-input-solo-lectura"
        />
        <p className="perfil-campo-ayuda">
          El correo no se puede cambiar aquí. Es tu identificador de acceso.
        </p>
      </div>

      <fieldset className="perfil-notificaciones">
        <legend>Notificaciones</legend>
        <label className="perfil-check">
          <input
            type="checkbox"
            checked={notificacionesInApp}
            onChange={(e) => setNotificacionesInApp(e.target.checked)}
          />
          Notificaciones en la app
        </label>
        <label className="perfil-check">
          <input
            type="checkbox"
            checked={notificacionesEmail}
            onChange={(e) => setNotificacionesEmail(e.target.checked)}
          />
          Avisos por correo (avistamientos y mensajes)
        </label>
      </fieldset>

      <button type="submit" disabled={cargando} className="submit-btn">
        {cargando ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
