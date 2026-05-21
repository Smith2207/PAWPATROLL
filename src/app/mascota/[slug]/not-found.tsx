import Link from "next/link";
import "@/estilos/mascotas.css";

export default function MascotaNoEncontrada() {
  return (
    <div className="ficha-publica" style={{ textAlign: "center" }}>
      <h1 style={{ fontFamily: "var(--font-fredoka)" }}>Mascota no disponible</h1>
      <p style={{ fontWeight: 600, color: "var(--muted)" }}>
        La ficha no existe o no está publicada (solo mascotas perdidas o
        encontradas).
      </p>
      <Link href="/" className="btn-mascota btn-mascota--primario" style={{ marginTop: "1.5rem" }}>
        Ir al inicio
      </Link>
    </div>
  );
}
