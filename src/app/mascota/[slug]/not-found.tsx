import Link from "next/link";
import { EnvolturaPaginasApp } from "@/componentes/layout/EnvolturaPaginasApp";

export default function MascotaNoEncontrada() {
  return (
    <EnvolturaPaginasApp>
    <div className="ficha-publica" style={{ textAlign: "center" }}>
      <h1 className="ficha-publica-titulo">Mascota no disponible</h1>
      <p className="texto-vacio-modulo">
        Esta mascota no existe o no está publicada (solo mascotas perdidas o
        encontradas).
      </p>
      <Link href="/" className="btn-mascota btn-mascota--primario" style={{ marginTop: "1.5rem" }}>
        Ir al inicio
      </Link>
    </div>
    </EnvolturaPaginasApp>
  );
}
