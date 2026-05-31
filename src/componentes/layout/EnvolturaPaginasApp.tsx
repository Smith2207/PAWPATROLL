import { BarraNavegacionApp } from "@/componentes/layout/BarraNavegacionApp";
import { PiePagina } from "@/componentes/landing/PiePagina";

type Props = {
  children: React.ReactNode;
  /** Pie institucional (fichas públicas, páginas de confianza) */
  pie?: boolean;
};

export function EnvolturaPaginasApp({ children, pie }: Props) {
  return (
    <>
      <BarraNavegacionApp />
      {children}
      {pie ? <PiePagina /> : null}
    </>
  );
}
