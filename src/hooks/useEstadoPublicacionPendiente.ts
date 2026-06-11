"use client";



/**
 * Hook React: estado publicacion pendiente.
 */
import { useMemo } from "react";
import { useModales } from "@/contexto/ContextoModales";
import { hayAvistamientoPendienteAuth } from "@/lib/avistamientos/borrador-cliente";
import { hayPerdidaPendienteAuth } from "@/lib/perdidas/borrador-cliente";

const TEXTOS_DEFECTO = {
  tituloLogin: "Bienvenido a PawPatroll",
  subtituloLogin:
    "Inicia sesión para ayudar a encontrar mascotas perdidas",
  subtituloRegistro:
    "Únete a PawPatroll y protege a tus mascotas con su perfil digital",
} as const;

const TEXTOS_PERDIDA = {
  tituloLogin: "Último paso: tu cuenta",
  subtituloLogin:
    "Tu alerta de búsqueda está lista. Inicia sesión o regístrate para activarla de forma segura.",
  subtituloRegistro:
    "Crea tu cuenta para activar la alerta que ya completaste. Luego verifica tu correo e inicia sesión.",
} as const;

const TEXTOS_AVISTAMIENTO = {
  tituloLogin: "Último paso: tu cuenta",
  subtituloLogin:
    "Tu avistamiento está listo. Inicia sesión o regístrate para publicarlo de forma segura.",
  subtituloRegistro:
    "Crea tu cuenta para publicar el avistamiento que ya completaste. Luego verifica tu correo e inicia sesión.",
} as const;

/** Flags y textos de modales auth cuando hay un reporte en borrador. */
export function useEstadoPublicacionPendiente() {
  const { avistamientoPendienteAuth, perdidaPendienteAuth } = useModales();

  const pendienteAvistamiento =
    avistamientoPendienteAuth || hayAvistamientoPendienteAuth();
  const pendientePerdida =
    perdidaPendienteAuth || hayPerdidaPendienteAuth();

  const textos = useMemo(() => {
    if (pendientePerdida) return TEXTOS_PERDIDA;
    if (pendienteAvistamiento) return TEXTOS_AVISTAMIENTO;
    return TEXTOS_DEFECTO;
  }, [pendienteAvistamiento, pendientePerdida]);

  return {
    pendienteAvistamiento,
    pendientePerdida,
    pendiente: pendientePerdida || pendienteAvistamiento,
    ...textos,
  };
}
