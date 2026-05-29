import type { Metadata } from "next";
import { Suspense } from "react";
import { AbrirLoginDesdeUrl } from "@/componentes/auth/AbrirLoginDesdeUrl";
import { GestorBienvenida } from "@/componentes/auth/GestorBienvenida";
import { ProveedorSesion } from "@/componentes/auth/ProveedorSesion";
import { ModalesGlobales } from "@/componentes/landing/ModalesGlobales";
import { ProveedorModales } from "@/contexto/ContextoModales";
import { Nunito, Fredoka } from "next/font/google";
import "./globals.css";
import "@/estilos/paleta.css";
import "@/estilos/landing-pawpatrol.css";
import "@/estilos/auth.css";
import "@/estilos/mascotas.css";
import "@/estilos/perfil.css";
import "@/estilos/responsive.css";
import "@/estilos/mapa.css";
import "@/estilos/visual.css";
import "@/estilos/admin.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-fredoka",
});

export const metadata: Metadata = {
  title: "PawPatrol — Encuentra a tu mascota perdida",
  description:
    "PawPatrol usa inteligencia artificial y mapas interactivos para reunir mascotas perdidas con sus familias.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${nunito.variable} ${fredoka.variable}`}
      data-scroll-behavior="smooth"
    >
      <body
        style={{
          fontFamily: "var(--font-nunito), 'Nunito', sans-serif",
        }}
      >
        <ProveedorSesion>
          <ProveedorModales>
            <Suspense fallback={null}>
              <AbrirLoginDesdeUrl />
            </Suspense>
            {children}
            <ModalesGlobales />
            <GestorBienvenida />
          </ProveedorModales>
        </ProveedorSesion>
      </body>
    </html>
  );
}
