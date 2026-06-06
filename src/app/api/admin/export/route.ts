import { NextRequest } from "next/server";
import { exportarCsvAdmin } from "@/actions/admin";

const ARCHIVOS: Record<string, string> = {
  avistamientos: "pawpatrol-avistamientos.csv",
  usuarios: "pawpatrol-usuarios.csv",
  "mascotas-perdidas": "pawpatrol-mascotas-perdidas.csv",
  reportes: "pawpatrol-reportes-abuso.csv",
};

export async function GET(req: NextRequest) {
  const tipo = req.nextUrl.searchParams.get("tipo") ?? "avistamientos";
  const nombre = ARCHIVOS[tipo] ?? ARCHIVOS.avistamientos;

  try {
    const csv = await exportarCsvAdmin(tipo);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nombre}"`,
      },
    });
  } catch {
    return new Response("No autorizado", { status: 403 });
  }
}
