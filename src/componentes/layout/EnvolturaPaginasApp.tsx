import { BarraNavegacionApp } from "@/componentes/layout/BarraNavegacionApp";

type Props = {
  children: React.ReactNode;
};

/** Layout con navbar de la marca para páginas fuera de la landing */
export function EnvolturaPaginasApp({ children }: Props) {
  return (
    <>
      <BarraNavegacionApp />
      {children}
    </>
  );
}
