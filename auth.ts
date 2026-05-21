import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/lib/db/schema";
import type { RolUsuario } from "@/lib/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/iniciar-sesion",
    newUser: "/registro",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "correo",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString();

        if (!email || !password) return null;

        const [usuario] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!usuario?.passwordHash) return null;

        const valido = await bcrypt.compare(password, usuario.passwordHash);
        if (!valido) return null;

        if (!usuario.emailVerified) {
          return null;
        }

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.name,
          image: usuario.image,
          rol: usuario.rol,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const [existente] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (existente && !existente.emailVerified) {
          await db
            .update(users)
            .set({ emailVerified: new Date() })
            .where(eq(users.id, existente.id));
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as { rol?: RolUsuario }).rol ?? "CIUDADANO";
      }

      if (token.email && !token.rol) {
        const [usuario] = await db
          .select({ rol: users.rol, id: users.id })
          .from(users)
          .where(eq(users.email, token.email))
          .limit(1);

        if (usuario) {
          token.id = usuario.id;
          token.rol = usuario.rol;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rol = (token.rol as RolUsuario) ?? "CIUDADANO";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.email) {
        const [existente] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (existente && !existente.emailVerified) {
          await db
            .update(users)
            .set({ emailVerified: new Date() })
            .where(eq(users.id, existente.id));
        }
      }
    },
  },
});
