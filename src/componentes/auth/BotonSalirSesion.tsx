"use client";

import { signOut } from "next-auth/react";

export function BotonSalirSesion() {
  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={() => signOut({ redirectTo: "/" })}
    >
      Salir
    </button>
  );
}
