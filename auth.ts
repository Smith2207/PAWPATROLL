/**
 * Configuración Auth.js: proveedores, callbacks JWT y sesión.
 */
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authConfig } from "./auth.config";
import { db } from "@/lib/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/lib/db/schema";
import type { RolUsuario } from "@/lib/db/schema";
import { normalizarCorreo, rolParaNuevoUsuario, esCorreoAdmin } from "@/lib/auth/admin";
import { normalizarRolCuenta } from "@/lib/auth/rol-cuenta";
import { imagenParaJwt } from "@/lib/auth/imagen-token";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
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

        if (usuario.activo === false) return null;

        if (!usuario.emailVerified) {
          return null;
        }

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.name,
          image: imagenParaJwt(usuario.image),
          rol: usuario.rol,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        const nombreGoogle =
          user.name ??
          (profile as { name?: string } | undefined)?.name ??
          null;
        const fotoGoogle =
          user.image ??
          (profile as { picture?: string } | undefined)?.picture ??
          null;

        const correo = normalizarCorreo(user.email);

        const [existente] = await db
          .select({ image: users.image })
          .from(users)
          .where(eq(users.email, correo))
          .limit(1);

        const imagenPersonalizada =
          existente?.image?.startsWith("data:image/") ?? false;

        await db
          .update(users)
          .set({
            name: nombreGoogle,
            ...(imagenPersonalizada ? {} : { image: fotoGoogle }),
            emailVerified: new Date(),
            rol: rolParaNuevoUsuario(correo),
            ...(esCorreoAdmin(correo) ? { bienvenidaCompletada: true } : {}),
          })
          .where(eq(users.email, correo));

        const [cuenta] = await db
          .select({ activo: users.activo })
          .from(users)
          .where(eq(users.email, correo))
          .limit(1);

        if (cuenta?.activo === false) return false;
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      async function sincronizarTokenConUsuario(correo: string) {
        const [usuario] = await db
          .select({
            id: users.id,
            rol: users.rol,
            name: users.name,
            image: users.image,
          })
          .from(users)
          .where(eq(users.email, correo))
          .limit(1);

        if (!usuario) return;

        const rol = normalizarRolCuenta(usuario.rol, correo);
        if (usuario.rol !== rol) {
          await db.update(users).set({ rol }).where(eq(users.id, usuario.id));
        }

        token.id = usuario.id;
        token.email = correo;
        token.rol = rol;
        token.name = usuario.name;
        token.picture = imagenParaJwt(usuario.image);
      }

      if (trigger === "update" && token.email) {
        await sincronizarTokenConUsuario(normalizarCorreo(token.email as string));
        return token;
      }

      if (user?.email) {
        await sincronizarTokenConUsuario(normalizarCorreo(user.email));
        return token;
      }

      if (user?.id) {
        const [usuario] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1);

        if (usuario?.email) {
          await sincronizarTokenConUsuario(normalizarCorreo(usuario.email));
          return token;
        }
      }

      if (user) {
        token.id = user.id;
        token.rol = normalizarRolCuenta(
          (user as { rol?: RolUsuario }).rol,
          user.email
        );
        token.name = user.name;
        token.picture = imagenParaJwt(user.image);
      } else if (token.email) {
        await sincronizarTokenConUsuario(normalizarCorreo(token.email as string));
      }

      return token;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/iniciar-sesion")) return baseUrl;

      if (url.startsWith("/")) return `${baseUrl}${url}`;

      if (url.startsWith(baseUrl)) {
        const ruta = new URL(url).pathname;
        if (ruta === "/iniciar-sesion") return baseUrl;
        return url;
      }

      return baseUrl;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email || !user.id) return;

      const correo = normalizarCorreo(user.email);
      const rol = rolParaNuevoUsuario(correo);

      await db
        .update(users)
        .set({
          rol,
          emailVerified: new Date(),
          bienvenidaCompletada: false,
        })
        .where(eq(users.id, user.id));

      const { enviarCorreoBienvenida } = await import(
        "@/lib/email/enviarBienvenida"
      );
      await enviarCorreoBienvenida(correo, user.name ?? "Usuario", rol);
    },
  },
});
