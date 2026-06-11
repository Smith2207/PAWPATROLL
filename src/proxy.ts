/**
 * Middleware (proxy): protege rutas autenticadas y /admin.
 */
import { authConfig } from "../auth.config";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/iniciar-sesion")) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  if (req.auth && pathname.startsWith("/registro")) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  const rutasProtegidas = ["/perfil", "/mis-mascotas", "/admin"];
  const esProtegida = rutasProtegidas.some((r) => pathname.startsWith(r));

  if (esProtegida && !req.auth) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  if (pathname.startsWith("/admin")) {
    if (req.auth?.user?.rol !== "ADMINISTRADOR") {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/perfil/:path*",
    "/mis-mascotas/:path*",
    "/admin/:path*",
    "/registro",
    "/iniciar-sesion",
  ],
};
