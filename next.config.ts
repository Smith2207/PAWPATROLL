import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "sharp",
    "@google/genai",
    "@xenova/transformers",
    "onnxruntime-web",
  ],
  webpack: (config, { isServer }) => {
    if (isServer && process.env.VERCEL) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "onnxruntime-node": "onnxruntime-web",
      };
    }
    return config;
  },
  turbopack: {
    resolveAlias: process.env.VERCEL
      ? { "onnxruntime-node": "onnxruntime-web" }
      : {},
  },
  outputFileTracingExcludes: {
    "/api/ia/buscar": ["**/node_modules/onnxruntime-node/**"],
    "/api/ia/indexar": ["**/node_modules/onnxruntime-node/**"],
  },
};

export default nextConfig;
