"use client";

import { useModales } from "@/contexto/ContextoModales";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

type Props = {
  enMenuMovil?: boolean;
  /** En barra app: sin enlaces duplicados (ya están en el centro) */
  compacto?: boolean;
};

function inicialUsuario(nombre?: string | null, correo?: string | null) {
  const base = (nombre ?? correo ?? "?").trim();
  return base.charAt(0).toUpperCase();
}

export function MenuUsuario({ enMenuMovil = false, compacto = false }: Props) {
  const { data: sesion, status } = useSession();
  const { abrirModal } = useModales();

  const claseContenedor = enMenuMovil
    ? "nav-usuario nav-usuario--movil"
    : compacto
      ? "nav-usuario nav-usuario--compacto"
      : "nav-usuario";

  if (status === "loading") {
    return (
      <span className="nav-usuario-cargando" aria-hidden>
        …
      </span>
    );
  }

  if (!sesion?.user) {
    return (
      <div className={claseContenedor}>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => abrirModal("login")}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          className="btn-orange-nav"
          onClick={() => abrirModal("report")}
        >
          <span className="nav-cta-icono" aria-hidden>
            🚨
          </span>
          <span className="nav-cta-texto">Reportar pérdida</span>
        </button>
      </div>
    );
  }

  const nombre = sesion.user.name ?? sesion.user.email?.split("@")[0] ?? "Cuenta";

  if (enMenuMovil) {
    return (
      <div className={claseContenedor}>
        <Link href="/perfil" className="nav-usuario-chip nav-usuario-chip--bloque">
          <span className="nav-usuario-inicial" aria-hidden>
            {inicialUsuario(sesion.user.name, sesion.user.email)}
          </span>
          <span className="nav-usuario-nombre">{nombre}</span>
        </Link>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => signOut({ redirectTo: "/" })}
        >
          Cerrar sesión
        </button>
        <button
          type="button"
          className="btn-orange-nav"
          onClick={() => abrirModal("report")}
        >
          <span className="nav-cta-icono" aria-hidden>
            🚨
          </span>
          <span className="nav-cta-texto">Reportar pérdida</span>
        </button>
      </div>
    );
  }

  return (
    <div className={claseContenedor}>
      <Link href="/perfil" className="nav-usuario-chip" title="Mi perfil">
        <span className="nav-usuario-inicial" aria-hidden>
          {inicialUsuario(sesion.user.name, sesion.user.email)}
        </span>
        <span className="nav-usuario-nombre">{nombre}</span>
      </Link>
      <button
        type="button"
        className="btn-ghost btn-ghost--nav-salir"
        onClick={() => signOut({ redirectTo: "/" })}
        title="Cerrar sesión"
      >
        Salir
      </button>
      <button
        type="button"
        className="btn-orange-nav btn-orange-nav--nav"
        onClick={() => abrirModal("report")}
        title="Reportar pérdida de mascota"
      >
        <span className="nav-cta-icono" aria-hidden>
          🚨
        </span>
        <span className="nav-cta-texto">Reportar</span>
      </button>
    </div>
  );
}
