/**
 * Opciones compartidas de Auth.js (páginas, estrategia JWT).
 */
import type { NextAuthConfig } from "next-auth";
import type { RolUsuario } from "@/lib/db/schema";
import { normalizarRolCuenta } from "@/lib/auth/rol-cuenta";
import { imagenParaJwt } from "@/lib/auth/imagen-token";

/**
 * Configuración ligera para proxy (protección de rutas).
 * Sin base de datos, bcrypt ni nodemailer.
 */
export const authConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = normalizarRolCuenta(
          (user as { rol?: RolUsuario }).rol,
          user.email
        );
        token.name = user.name;
        token.picture = imagenParaJwt(user.image);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rol = normalizarRolCuenta(
          token.rol as RolUsuario,
          token.email as string | undefined
        );
        session.user.name = (token.name as string | null) ?? null;
        session.user.image = (token.picture as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
