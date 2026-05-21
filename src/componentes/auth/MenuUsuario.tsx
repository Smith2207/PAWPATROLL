"use client";

import { useModales } from "@/contexto/ContextoModales";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export function MenuUsuario() {
  const { data: sesion, status } = useSession();
  const { abrirModal } = useModales();

  if (status === "loading") {
    return <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>...</span>;
  }

  if (!sesion?.user) {
    return (
      <>
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
      </>
    );
  }

  return (
    <div className="nav-usuario">
      <Link href="/perfil">👤 {sesion.user.name ?? "Perfil"}</Link>
      <Link href="/mis-mascotas">🐾 Mis mascotas</Link>
      <button
        type="button"
        className="btn-ghost"
        onClick={() => signOut({ callbackUrl: "/" })}
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
