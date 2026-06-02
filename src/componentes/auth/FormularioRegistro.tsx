"use client";

import { registrarUsuario } from "@/actions/autenticacion";
import { CampoContrasena } from "@/componentes/auth/CampoContrasena";
import { Icono } from "@/componentes/ui/Icono";
import { useModales } from "@/contexto/ContextoModales";
import { esCorreoValido, mensajeCorreoInvalido } from "@/lib/auth/validacion-correo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const PASOS = [
  { id: 1, titulo: "Tu nombre" },
  { id: 2, titulo: "Tu correo" },
  { id: 3, titulo: "Tu contraseña" },
] as const;

type Props = {
  enModal?: boolean;
};

export function FormularioRegistro({ enModal = false }: Props) {
  const router = useRouter();
  const { status } = useSession();
  const { abrirModal, cerrarModal } = useModales();

  useEffect(() => {
    if (status === "authenticated") {
      if (enModal) cerrarModal("registro");
      router.replace("/");
      router.refresh();
    }
  }, [status, enModal, cerrarModal, router]);

  const [paso, setPaso] = useState(1);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [errorEmail, setErrorEmail] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  function validarPasoActual(): boolean {
    setError(null);

    if (paso === 1) {
      if (nombre.trim().length < 2) {
        setError("Escribe tus nombres y apellidos (mínimo 2 caracteres).");
        return false;
      }
      return true;
    }

    if (paso === 2) {
      const msg = mensajeCorreoInvalido(email);
      setErrorEmail(msg);
      if (msg) return false;
      return true;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return false;
    }
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return false;
    }

    return true;
  }

  function siguiente() {
    if (!validarPasoActual()) return;
    setPaso((p) => Math.min(p + 1, 3));
  }

  function anterior() {
    setError(null);
    setErrorEmail(null);
    setPaso((p) => Math.max(p - 1, 1));
  }

  function onEmailChange(valor: string) {
    setEmail(valor);
    if (errorEmail) setErrorEmail(mensajeCorreoInvalido(valor));
  }

  function irInicioSesion(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!enModal) return;
    e.preventDefault();
    cerrarModal("registro");
    abrirModal("login");
  }

  async function iniciarConGoogle() {
    setCargando(true);
    if (enModal) cerrarModal("registro");
    await signIn("google", { callbackUrl: "/" });
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!validarPasoActual()) return;

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
    if (enModal) cerrarModal("registro");
    const correo = encodeURIComponent(email.trim().toLowerCase());
    router.push(`/verificar-correo?pendiente=1&email=${correo}`);
  }

  const formulario = (
    <>
      {!enModal && (
        <>
          <h1>
            <Icono nombre="huella" size={24} className="pp-icon--btn" /> Crear cuenta
          </h1>
          <p className="auth-sub">
            Reporta mascotas perdidas, guarda el perfil de tus mascotas y ayuda a
            la comunidad. Con correo y contraseña debes verificar tu email antes de
            entrar.
          </p>
        </>
      )}

      <div className="auth-google-box">
        <p className="auth-google-box-titulo">Entra más rápido con Google</p>
        <p className="auth-google-box-sub">
          Si prefieres Google, no necesitas completar este formulario.
        </p>
        <button
          type="button"
          disabled={cargando}
          onClick={iniciarConGoogle}
          className="btn-google btn-google--registro"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuar con Google
        </button>
      </div>

      <div className="section-divider">o regístrate con correo</div>

      <div className="auth-pasos" aria-label="Progreso del registro">
        {PASOS.map((p) => (
          <div
            key={p.id}
            className={`auth-paso ${paso === p.id ? "auth-paso--activo" : ""} ${paso > p.id ? "auth-paso--hecho" : ""}`}
          >
            <span className="auth-paso-num">{p.id}</span>
            <span className="auth-paso-titulo">{p.titulo}</span>
          </div>
        ))}
      </div>

      {error && <p className="auth-alerta auth-alerta--error">{error}</p>}
      {mensaje && <p className="auth-alerta auth-alerta--ok">{mensaje}</p>}

      <form onSubmit={paso === 3 ? enviar : (e) => { e.preventDefault(); siguiente(); }}>
        {paso === 1 && (
          <div className="form-group">
            <label htmlFor="registro-nombre">Nombres y Apellidos *</label>
            <input
              id="registro-nombre"
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: María López García"
              autoFocus
            />
          </div>
        )}

        {paso === 2 && (
          <div className="form-group">
            <label htmlFor="registro-email">Correo electrónico *</label>
            <input
              id="registro-email"
              type="email"
              required
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              onBlur={() => setErrorEmail(mensajeCorreoInvalido(email))}
              placeholder="tucorreo@ejemplo.com"
              autoFocus
              aria-invalid={!!errorEmail}
              aria-describedby={errorEmail ? "registro-email-error" : undefined}
            />
            {errorEmail && (
              <p id="registro-email-error" className="auth-campo-error" role="alert">
                {errorEmail}
              </p>
            )}
            {email && esCorreoValido(email) && (
              <p className="auth-campo-ok">
                <Icono nombre="check" size={14} className="pp-icon--btn" /> Correo con formato válido
              </p>
            )}
          </div>
        )}

        {paso === 3 && (
          <>
            <CampoContrasena
              id="registro-password"
              label="Contraseña * (mín. 8 caracteres)"
              value={password}
              onChange={setPassword}
            />
            <CampoContrasena
              id="registro-password2"
              label="Confirmar contraseña *"
              value={password2}
              onChange={setPassword2}
              placeholder="Repite tu contraseña"
            />
          </>
        )}

        <div className="auth-pasos-acciones">
          {paso > 1 && (
            <button type="button" className="btn-mascota btn-mascota--secundario" onClick={anterior}>
              Atrás
            </button>
          )}
          <button type="submit" disabled={cargando} className="submit-btn">
            {cargando
              ? "Creando cuenta..."
              : paso === 3
                ? "Registrarme"
                : "Siguiente"}
          </button>
        </div>
      </form>

      <p className="auth-enlace" style={enModal ? { marginBottom: 0 } : undefined}>
        ¿Ya tienes cuenta?{" "}
        <Link
          href={enModal ? "/?login=1" : "/?login=1"}
          onClick={irInicioSesion}
        >
          Iniciar sesión
        </Link>
      </p>
    </>
  );

  if (enModal) return formulario;

  return (
    <div className="auth-pagina">
      <div className="auth-card">{formulario}</div>
    </div>
  );
}
