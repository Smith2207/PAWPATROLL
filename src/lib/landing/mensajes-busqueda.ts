import type { FiltrosBusquedaMascotasPublicas } from "@/actions/mascotas";

export function hayFiltrosBusqueda(f: FiltrosBusquedaMascotasPublicas): boolean {
  return Boolean(f.q?.trim() || f.tipo || f.dias);
}

export function mensajeSinResultados(
  filtros: FiltrosBusquedaMascotasPublicas
): string {
  if (filtros.dias) {
    return "No hay casos reportados en las últimas 24 horas.";
  }
  if (filtros.tipo) {
    return `No hay ${filtros.tipo.toLowerCase()}s perdidos que coincidan.`;
  }
  if (filtros.q?.trim()) {
    return `Ningún caso coincide con «${filtros.q.trim()}».`;
  }
  return "No hay casos que coincidan con tu búsqueda.";
}
