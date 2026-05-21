import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const rutasProtegidas = ["/perfil", "/mis-mascotas", "/admin"];
  const esProtegida = rutasProtegidas.some((r) =>
    req.nextUrl.pathname.startsWith(r)
  );

  if (esProtegida && !req.auth) {
    const login = new URL("/iniciar-sesion", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (req.auth?.user?.rol !== "ADMINISTRADOR") {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/perfil/:path*", "/mis-mascotas/:path*", "/admin/:path*"],
};
