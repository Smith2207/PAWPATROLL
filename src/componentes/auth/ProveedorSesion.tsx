"use client";



/**
 * [auth] Proveedor: sesion.
 */
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export function ProveedorSesion({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
