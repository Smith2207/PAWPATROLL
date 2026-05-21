import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";

export default function LayoutApp({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EnvolturaPaginasApp>{children}</EnvolturaPaginasApp>;
}
