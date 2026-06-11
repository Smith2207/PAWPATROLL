import {
  radioBaseEvidencia,
  resolverContextoBusqueda,
  type ContextoBusqueda,
} from "@/lib/comportamiento/contexto-busqueda";
import { EVIDENCIA } from "@/lib/comportamiento/fuentes";
import type { PerfilConductual } from "@/lib/comportamiento/conocimiento";

export type RadioEvidencia = {
  radioBaseMetros: number;
  contexto: ContextoBusqueda;
  notaRadio: string;
  fuenteId: string;
};

export function estimarRadioConEvidencia(perfil: {
  tipo?: string | null;
  tamano?: string | null;
  edad?: string | null;
  accesoExterior?: string | null;
  descripcion?: string | null;
  senasParticulares?: string | null;
}): RadioEvidencia {
  const contexto = resolverContextoBusqueda(perfil);
  const { metros, nota, fuenteId } = radioBaseEvidencia(contexto, perfil.tamano);
  return {
    radioBaseMetros: metros,
    contexto,
    notaRadio: nota,
    fuenteId,
  };
}

/** Radio de búsqueda en metros (mapa y reportes de pérdida). */
export function estimarRadioBusquedaMetros(perfil: {
  tipo?: string | null;
  tamano?: string | null;
  edad?: string | null;
  accesoExterior?: string | null;
  descripcion?: string | null;
  senasParticulares?: string | null;
}): number {
  return estimarRadioConEvidencia(perfil).radioBaseMetros;
}

/** Expansión diaria y tope según evidencia y acceso al exterior. */
export function parametrosExpansionTemporal(
  contexto: ContextoBusqueda,
  conductual: PerfilConductual
): {
  expansionDiaria: number;
  factorMaximo: number;
  horasCriticas: number;
} {
  if (contexto.esGato) {
    switch (contexto.acceso) {
      case "solo_interior":
        return {
          expansionDiaria: 0.08,
          factorMaximo: 2.2,
          horasCriticas: EVIDENCIA.HORAS_CRITICAS,
        };
      case "patio_supervisado":
        return {
          expansionDiaria: 0.15,
          factorMaximo: 2.8,
          horasCriticas: EVIDENCIA.HORAS_CRITICAS,
        };
      case "exterior_habitual":
        return {
          expansionDiaria: 0.22,
          factorMaximo: Math.min(
            3.2,
            EVIDENCIA.GATO_EXTERIOR_P75_VIAJE_M / EVIDENCIA.GATO_MIXTO_RADIO_P75_M
          ),
          horasCriticas: EVIDENCIA.HORAS_CRITICAS,
        };
    }
  }

  const expansionDiaria =
    contexto.acceso === "solo_interior"
      ? 0.12
      : contexto.acceso === "patio_supervisado"
        ? 0.22
        : conductual.expansionDiaria;

  return {
    expansionDiaria,
    factorMaximo: contexto.acceso === "solo_interior" ? 2 : 3.2,
    horasCriticas: 48,
  };
}
