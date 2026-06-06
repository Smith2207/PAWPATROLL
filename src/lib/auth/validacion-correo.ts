export function esCorreoValido(correo: string): boolean {
  const limpio = correo.trim();
  if (!limpio.includes("@")) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpio);
}

export function mensajeCorreoInvalido(correo: string): string | null {
  const limpio = correo.trim();
  if (!limpio) return "Escribe tu correo electrónico.";
  if (!limpio.includes("@")) return "El correo debe incluir arroba (@), por ejemplo: nombre@ejemplo.com";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpio)) {
    return "Escribe un correo válido, por ejemplo: nombre@ejemplo.com";
  }
  return null;
}
