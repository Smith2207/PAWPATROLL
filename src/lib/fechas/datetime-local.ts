/** Valor para `<input type="datetime-local" />` en hora local (no UTC). */
export function valorDatetimeLocal(fecha: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
}

export function valorDatetimeLocalActual(): string {
  return valorDatetimeLocal(new Date());
}

export function parsearDatetimeLocal(valor: string): Date | null {
  if (!valor.trim()) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}
