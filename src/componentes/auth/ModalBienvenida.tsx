"use client";



/**
 * [auth] Modal: bienvenida.
 */
import { completarBienvenida } from "@/actions/autenticacion";
import { CampoCiudad } from "@/componentes/formulario/CampoCiudad";
import { Icono } from "@/componentes/ui/Icono";
import { PASOS_PRIMERA_VEZ } from "@/lib/landing/pasos-primera-vez";
import { RUTAS_LANDING } from "@/lib/landing/rutas";
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
        <div className="modal-bienvenida-emoji">
          <Icono nombre="huella" size={40} />
        </div>
        <h2 id="modal-bienvenida-titulo">¿Primera vez en PawPatrol?</h2>
        <ol className="modal-bienvenida-pasos" aria-label="Cómo usar PawPatrol">
          {PASOS_PRIMERA_VEZ.map((p) => (
            <li key={p.titulo}>
              <span>
                <Icono nombre={p.icono} size={20} />
              </span>
              <div>
                <strong>{p.titulo}</strong>
                <p>{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="modal-bienvenida-sub">
          Completa tu perfil para que la comunidad pueda contactarte si reportas o
          ayudas con una mascota.
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
            <CampoCiudad
              id="bienvenida-ciudad"
              label="Ciudad (opcional)"
              value={ciudad}
              onChange={setCiudad}
              placeholder="Ej: Juliaca"
            />
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
          <Link href={RUTAS_LANDING.casosActivos} onClick={omitir}>
            Ver casos activos
          </Link>
          {" · "}
          <Link href={RUTAS_LANDING.comunidad} onClick={omitir}>
            Abrir mapa
          </Link>
          {" · "}
          <Link href="/mis-mascotas/ficha" onClick={omitir}>
            Crear mascota
          </Link>
        </p>
      </div>
    </div>
  );
}
