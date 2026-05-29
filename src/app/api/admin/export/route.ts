import { exportarCsvAdmin } from "@/actions/admin";

export async function GET() {
  try {
    const csv = await exportarCsvAdmin();
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="pawpatrol-avistamientos.csv"',
      },
    });
  } catch {
    return new Response("No autorizado", { status: 403 });
  }
}
