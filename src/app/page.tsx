import { listarMascotasPerdidasPublicas } from "@/actions/mascotas";
import PaginaLanding from "@/componentes/landing/PaginaLanding";
import "@/estilos/landing-pawpatrol.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  let mascotasActivas: Awaited<
    ReturnType<typeof listarMascotasPerdidasPublicas>
  > = [];

  try {
    mascotasActivas = await listarMascotasPerdidasPublicas();
  } catch {
    // BD no disponible (p. ej. build sin red o migración pendiente)
  }

  return <PaginaLanding mascotasActivas={mascotasActivas} />;
}
