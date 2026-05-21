"use client";

import { eliminarMascota } from "@/actions/mascotas";
import { useRouter } from "next/navigation";

export function BotonEliminarMascota({ id }: { id: string }) {
  const router = useRouter();

  async function eliminar() {
    if (!confirm("¿Eliminar esta mascota del perfil?")) return;
    await eliminarMascota(id);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={eliminar}
      style={{
        background: "#FEF2F2",
        border: "1px solid #FECACA",
        color: "#991B1B",
        borderRadius: 8,
        padding: "4px 10px",
        fontSize: "0.75rem",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      Eliminar
    </button>
  );
}
