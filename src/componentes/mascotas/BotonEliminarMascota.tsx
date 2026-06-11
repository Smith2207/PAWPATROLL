"use client";



/**
 * [mascotas] Botón: eliminar mascota.
 */
import { eliminarMascota } from "@/actions/mascotas";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function BotonEliminarMascota({ id, nombre }: { id: string; nombre: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  async function eliminar() {
    if (
      !confirm(
        `¿Eliminar a ${nombre}? Se borrarán fotos y avistamientos vinculados.`
      )
    ) {
      return;
    }

    setCargando(true);
    const resultado = await eliminarMascota(id);
    setCargando(false);

    if (!resultado.ok) {
      alert(resultado.error);
      return;
    }

    router.push("/mis-mascotas");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={eliminar}
      disabled={cargando}
      className="btn-mascota btn-mascota--peligro"
    >
      {cargando ? "Eliminando..." : "Eliminar mascota"}
    </button>
  );
}
