import { hayAvistamientoPendienteAuth } from "@/lib/avistamientos/borrador-cliente";
import { hayPerdidaPendienteAuth } from "@/lib/perdidas/borrador-cliente";

export function hayPublicacionPendienteAuth(): boolean {
  return hayAvistamientoPendienteAuth() || hayPerdidaPendienteAuth();
}
