import { FormularioRegistro } from "@/componentes/auth/FormularioRegistro";
import Link from "next/link";
import "@/estilos/auth.css";

export default function PaginaRegistro() {
  return (
    <>
      <FormularioRegistro />
      <p style={{ textAlign: "center", paddingBottom: "2rem" }}>
        <Link href="/">← Volver al inicio</Link>
      </p>
    </>
  );
}
