import { NextResponse } from "next/server";
import { verificarCorreoConToken } from "@/actions/autenticacion";
import { urlBaseApp } from "@/lib/url-app";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const baseUrl = urlBaseApp();

  if (!token || !email) {
    return NextResponse.redirect(
      `${baseUrl}/verificar-correo?estado=error&motivo=parametros`
    );
  }

  const resultado = await verificarCorreoConToken(email, token);

  if (!resultado.ok) {
    return NextResponse.redirect(
      `${baseUrl}/verificar-correo?estado=error&motivo=${encodeURIComponent(resultado.error)}`
    );
  }

  return NextResponse.redirect(
    `${baseUrl}/verificar-correo?estado=ok`
  );
}
