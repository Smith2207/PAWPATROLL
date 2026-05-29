import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** sharp: binarios nativos. CLIP se importa solo en runtime (import dinámico). */
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
