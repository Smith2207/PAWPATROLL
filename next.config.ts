import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "@xenova/transformers", "onnxruntime-web"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // En serverless no hay libonnxruntime.so; usar runtime WASM
        "onnxruntime-node": "onnxruntime-web",
      };
    }
    return config;
  },
  turbopack: {
    resolveAlias: {
      "onnxruntime-node": "onnxruntime-web",
    },
  },
  outputFileTracingExcludes: {
    "/api/ia/buscar": ["**/node_modules/onnxruntime-node/**"],
    "/api/ia/indexar": ["**/node_modules/onnxruntime-node/**"],
  },
};

export default nextConfig;
