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
      className="btn-mascota btn-mascota--peligro"
    >
      Eliminar
    </button>
  );
}
