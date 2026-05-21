"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useModales } from "@/contexto/ContextoModales";

type Props = {
  enModal?: boolean;
};

export function FormularioInicioSesion({ enModal = false }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const { data: sesion, status } = useSession();
  const { cerrarModal } = useModales();

  useEffect(() => {
    if (status === "authenticated") {
      if (enModal) cerrarModal("login");
      router.replace("/");
      router.refresh();
    }
  }, [status, enModal, cerrarModal, router]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const registrado = params.get("registrado") === "1";
  const verificado = params.get("verificado") === "1";

  async function iniciarConGoogle() {
    setCargando(true);
    await signIn("google", { callbackUrl: "/" });
  }

  async function iniciarConCorreo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const resultado = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setCargando(false);

    if (resultado?.error) {
      if (resultado.error === "CredentialsSignin") {
        setError(
          "Correo o contraseña incorrectos, o tu correo aún no está verificado. Revisa tu bandeja o reenvía el enlace."
        );
      } else {
        setError("No se pudo iniciar sesión. Intenta de nuevo.");
      }
      return;
    }

    if (enModal) cerrarModal("login");
    router.replace("/");
    router.refresh();
  }

  return (
    <div>
      {registrado && !enModal && (
        <p
          style={{
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: "1rem",
            fontSize: "0.9rem",
          }}
        >
          Revisa tu correo para verificar la cuenta.{" "}
          <Link href="/verificar-correo">Reenviar correo de verificación</Link>
        </p>
      )}

      {verificado && !enModal && (
        <p
          style={{
            background: "#ECFDF5",
            border: "1px solid #A7F3D0",
            borderRadius: 12,
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "#065F46",
          }}
        >
          ✅ Correo verificado. Ya puedes iniciar sesión.
        </p>
      )}

      {error && (
        <p
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 12,
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "#991B1B",
          }}
        >
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={cargando}
        onClick={iniciarConGoogle}
        style={{
          width: "100%",
          background: "white",
          border: "2px solid var(--border)",
          padding: "0.8rem",
          borderRadius: "var(--radius-sm)",
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 800,
          fontSize: "0.95rem",
          color: "var(--navy)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginBottom: "1.2rem",
        }}
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

      <div className="section-divider">o inicia sesión con correo</div>

      <form onSubmit={iniciarConCorreo}>
        <div className="form-group">
          <label>Correo electrónico</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
          />
        </div>
        <div className="form-group">
          <label>Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={cargando}
          className="submit-btn submit-btn-navy"
          style={{ marginBottom: "1rem" }}
        >
          {cargando ? "Entrando..." : "Iniciar sesión"}
        </button>
      </form>

      {!sesion?.user && (
        <p
          style={{
            textAlign: "center",
            fontSize: "0.82rem",
            color: "var(--muted)",
            fontWeight: 700,
          }}
        >
          ¿No tienes cuenta?{" "}
          <Link
            href="/registro"
            style={{ color: "var(--blue)", fontWeight: 800 }}
          >
            Regístrate con correo
          </Link>
        </p>
      )}
    </div>
  );
}
