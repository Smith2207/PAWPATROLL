import type { NextAuthConfig } from "next-auth";
import type { RolUsuario } from "@/lib/db/schema";

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
        token.rol = (user as { rol?: RolUsuario }).rol ?? "CIUDADANO";
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rol = (token.rol as RolUsuario) ?? "CIUDADANO";
        session.user.name = (token.name as string | null) ?? null;
        session.user.image = (token.picture as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
