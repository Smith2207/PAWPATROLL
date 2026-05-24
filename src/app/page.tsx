import { listarMascotasPerdidasPublicas } from "@/actions/mascotas";
import PaginaLanding from "@/componentes/landing/PaginaLanding";
import { conTimeout } from "@/lib/utilidades/timeout";

export const dynamic = "force-dynamic";

export default async function Home() {
  let mascotasActivas: Awaited<
    ReturnType<typeof listarMascotasPerdidasPublicas>
  > = [];

  try {
    mascotasActivas = await conTimeout(listarMascotasPerdidasPublicas(), 8000);
  } catch {
    // BD no disponible, lenta o migración pendiente
  }

  return <PaginaLanding mascotasActivas={mascotasActivas} />;
}
