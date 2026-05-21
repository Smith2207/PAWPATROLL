import type { Metadata } from "next";
import { ProveedorSesion } from "@/componentes/auth/ProveedorSesion";
import { ProveedorModales } from "@/contexto/ContextoModales";
import { Nunito, Fredoka } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${nunito.variable} ${fredoka.variable}`}>
      <body
        style={{
          fontFamily: "var(--font-nunito), 'Nunito', sans-serif",
        }}
      >
        <ProveedorSesion>
          <ProveedorModales>{children}</ProveedorModales>
        </ProveedorSesion>
      </body>
    </html>
  );
}
