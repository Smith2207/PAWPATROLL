"use client";



/**
 * [auth] Componente React: abrir login desde url.
 */
/**
 * [auth] Componente React: abrir login desde url.
 */
import { useModales } from "@/contexto/ContextoModales";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/** Abre modales de auth si la URL trae ?login=1 o ?registro=1 */
export function AbrirLoginDesdeUrl() {
  const params = useSearchParams();
  const { abrirModal } = useModales();

  useEffect(() => {
    if (params.get("login") === "1") {
      abrirModal("login");
    }
    if (params.get("registro") === "1") {
      abrirModal("registro");
    }
  }, [params, abrirModal]);

  return null;
}
