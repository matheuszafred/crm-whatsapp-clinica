import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@google-analytics/data", "@grpc/grpc-js"],
  images: {
    remotePatterns: [{ hostname: "www.exemplo.com.br" }],
  },
};

export default nextConfig;
