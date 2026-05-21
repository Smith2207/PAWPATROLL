"use client";

import { useModales } from "@/contexto/ContextoModales";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/** Abre el modal de login si la URL trae ?login=1 (p. ej. enlaces antiguos a /iniciar-sesion). */
export function AbrirLoginDesdeUrl() {
  const params = useSearchParams();
  const { abrirModal } = useModales();

  useEffect(() => {
    if (params.get("login") === "1") {
      abrirModal("login");
    }
  }, [params, abrirModal]);

  return null;
}
