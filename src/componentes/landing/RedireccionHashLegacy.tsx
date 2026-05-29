"use client";

import { HASH_A_RUTA } from "@/lib/landing/rutas";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Si alguien entra con /#buscar o /#mapa, redirige a la ruta nueva. */
export function RedireccionHashLegacy() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.replace("#", "").trim();
    if (!hash) return;
    const destino = HASH_A_RUTA[hash];
    if (destino && destino !== window.location.pathname) {
      router.replace(destino);
    }
  }, [router]);

  return null;
}
