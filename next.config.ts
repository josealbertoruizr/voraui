import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/docs/**": ["./registry/voraui/**/*", "./registry.json"],
  },
};

export default nextConfig;
