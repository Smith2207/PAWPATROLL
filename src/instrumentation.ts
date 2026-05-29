export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { iniciarServidorWebSocket } = await import(
      "@/lib/tiempo-real/servidor-ws"
    );
    iniciarServidorWebSocket();
  }
}
