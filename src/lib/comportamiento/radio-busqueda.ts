import type { PerfilConductual } from "@/lib/comportamiento/conocimiento";
import {
  estimarRadioConEvidencia,
  parametrosExpansionTemporal,
} from "@/lib/comportamiento/evidencia-radios";
import { EVIDENCIA } from "@/lib/comportamiento/fuentes";

/** Radio de búsqueda ampliado según horas desde la pérdida (M5 + evidencia). */
export function calcularRadioBusquedaTemporal(
  perfilMascota: {
    tipo?: string | null;
    tamano?: string | null;
    edad?: string | null;
    accesoExterior?: string | null;
    descripcion?: string | null;
    senasParticulares?: string | null;
  },
  conductual: PerfilConductual,
  fechaPerdida: Date | null,
  radioGuardado?: number | null
): {
  radioBaseMetros: number;
  radioActualMetros: number;
  horasTranscurridas: number;
  diasTranscurridos: number;
} {
  const evidencia = estimarRadioConEvidencia({
    ...perfilMascota,
    tipo: perfilMascota.tipo ?? (conductual.contexto.esGato ? "gato" : "perro"),
  });

  const radioBase = radioGuardado ?? evidencia.radioBaseMetros;
  const expansion = parametrosExpansionTemporal(
    conductual.contexto,
    conductual
  );

  const ahora = Date.now();
  const inicio = fechaPerdida?.getTime() ?? ahora;
  const horasTranscurridas = Math.max(0, (ahora - inicio) / (1000 * 60 * 60));
  const diasTranscurridos = horasTranscurridas / 24;

  let factorExpansion = 1 + diasTranscurridos * expansion.expansionDiaria;

  if (horasTranscurridas < expansion.horasCriticas) {
    const t = horasTranscurridas / expansion.horasCriticas;
    factorExpansion = 1 + diasTranscurridos * expansion.expansionDiaria * (0.35 + t * 0.65);
  }

  if (
    conductual.contexto.esGato &&
    diasTranscurridos > EVIDENCIA.DIAS_BAJA_PROBABILIDAD_GATO / 30
  ) {
    factorExpansion *= 0.92;
  }

  const radioActualMetros = Math.min(
    Math.round(radioBase * factorExpansion),
    Math.round(radioBase * expansion.factorMaximo)
  );

  return {
    radioBaseMetros: radioBase,
    radioActualMetros,
    horasTranscurridas: Math.round(horasTranscurridas * 10) / 10,
    diasTranscurridos: Math.round(diasTranscurridos * 10) / 10,
  };
}
