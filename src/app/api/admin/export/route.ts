/**
 * API REST (/api/admin/export): endpoint admin › export.
 */
import { NextRequest } from "next/server";
import { exportarCsvAdmin } from "@/actions/admin";
import { verificarRateLimit } from "@/lib/api/rate-limit";

const ARCHIVOS: Record<string, string> = {
  avistamientos: "pawpatrol-avistamientos.csv",
  usuarios: "pawpatrol-usuarios.csv",
  "mascotas-perdidas": "pawpatrol-mascotas-perdidas.csv",
  reportes: "pawpatrol-reportes-abuso.csv",
};

export async function GET(req: NextRequest) {
  const bloqueado = verificarRateLimit(req, "admin-export", 10);
  if (bloqueado) return bloqueado;

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
