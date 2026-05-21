"use client";

import { useModales } from "@/contexto/ContextoModales";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

type Props = {
  enMenuMovil?: boolean;
};

export function MenuUsuario({ enMenuMovil = false }: Props) {
  const { data: sesion, status } = useSession();
  const { abrirModal } = useModales();

  const claseContenedor = enMenuMovil
    ? "nav-usuario nav-usuario--movil"
    : "nav-usuario";

  if (status === "loading") {
    return <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>...</span>;
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
          🚨 Reportar pérdida
        </button>
      </div>
    );
  }

  return (
    <div className={claseContenedor}>
      <Link href="/perfil">👤 {sesion.user.name ?? "Perfil"}</Link>
      <Link href="/mis-mascotas">🐾 Mis mascotas</Link>
      <button
        type="button"
        className="btn-ghost"
        onClick={() => signOut({ redirectTo: "/" })}
      >
        Salir
      </button>
      <button
        type="button"
        className="btn-orange-nav"
        onClick={() => abrirModal("report")}
      >
        🚨 Reportar pérdida
      </button>
    </div>
  );
}
