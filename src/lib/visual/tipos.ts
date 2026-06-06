export type { FiltrosBusquedaVisual } from "@/lib/visual/rerank";

export type CoincidenciaVisual = {
  mascotaId: string;
  nombre: string;
  slug: string;
  fotoUrl: string | null;
  similitud: number;
  modelo: string;
  descripcionAi?: string | null;
};

export type ResultadoBusquedaVisual = {
  ok: boolean;
  error?: string;
  coincidencias?: CoincidenciaVisual[];
  modelo?: string;
  indiceVacio?: boolean;
};
