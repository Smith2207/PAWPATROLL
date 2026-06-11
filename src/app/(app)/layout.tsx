/**
 * Landing pública (inicio). Layout compartido de la ruta (estructura y providers).
 */
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";

export default function LayoutApp({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EnvolturaPaginasApp>{children}</EnvolturaPaginasApp>;
}
