"use client";

import { completarBienvenida } from "@/actions/autenticacion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  nombreInicial: string;
  telefonoInicial: string;
  ciudadInicial: string;
  onCerrar: () => void;
};

export function ModalBienvenida({
  nombreInicial,
  telefonoInicial,
  ciudadInicial,
  onCerrar,
}: Props) {
  const router = useRouter();
  const [nombre, setNombre] = useState(nombreInicial);
  const [telefono, setTelefono] = useState(telefonoInicial);
  const [ciudad, setCiudad] = useState(ciudadInicial);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const resultado = await completarBienvenida({ nombre, telefono, ciudad });
    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    onCerrar();
    router.refresh();
  }

  async function omitir() {
    setCargando(true);
    await completarBienvenida({ nombre: nombreInicial, telefono: "", ciudad: "" });
    setCargando(false);
    onCerrar();
    router.refresh();
  }

  return (
    <div className="modal-bienvenida-overlay" role="presentation" onClick={omitir}>
      <div
        className="modal-bienvenida"
        role="dialog"
        aria-labelledby="modal-bienvenida-titulo"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-bienvenida-emoji" aria-hidden>
          🐾
        </div>
        <h2 id="modal-bienvenida-titulo">¡Bienvenido a PawPatrol!</h2>
        <p className="modal-bienvenida-sub">
          Nos alegra tenerte aquí. Completa un poco más tu perfil para que, si alguna
          mascota se pierde, la comunidad pueda contactarte más fácil.
        </p>

        {error && <p className="auth-alerta auth-alerta--error">{error}</p>}

        <form onSubmit={guardar}>
          <div className="form-group">
            <label htmlFor="bienvenida-nombre">Nombres y Apellidos</label>
            <input
              id="bienvenida-nombre"
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bienvenida-telefono">Teléfono (opcional)</label>
              <input
                id="bienvenida-telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 999 888 777"
              />
            </div>
            <div className="form-group">
              <label htmlFor="bienvenida-ciudad">Ciudad (opcional)</label>
              <input
                id="bienvenida-ciudad"
                type="text"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Ej: Lima"
              />
            </div>
          </div>

          <div className="modal-bienvenida-acciones">
            <button type="submit" disabled={cargando} className="submit-btn">
              {cargando ? "Guardando..." : "Guardar y continuar"}
            </button>
            <button
              type="button"
              disabled={cargando}
              className="btn-mascota btn-mascota--secundario"
              onClick={omitir}
            >
              Ahora no
            </button>
          </div>
        </form>

        <p className="modal-bienvenida-tip">
          ¿Listo para empezar?{" "}
          <Link href="/mis-mascotas/ficha" onClick={omitir}>
            Crea la ficha de tu primera mascota
          </Link>
        </p>
      </div>
    </div>
  );
}
