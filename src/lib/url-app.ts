/**
 * URL pública de la app para enlaces en correos (verificación, recuperar contraseña).
 * Prioridad: NEXT_PUBLIC_APP_URL → VERCEL_URL → AUTH_URL → localhost (solo desarrollo).
 */
export function urlBaseApp(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }

  const authUrl = process.env.AUTH_URL?.trim();
  if (authUrl) {
    return authUrl.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}
