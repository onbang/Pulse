import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID: process.env.VERCEL_DEPLOYMENT_ID ?? "",
    NEXT_PUBLIC_VERCEL_SKEW_PROTECTION_ENABLED:
      process.env.VERCEL_SKEW_PROTECTION_ENABLED ?? "",
  },
};

export default nextConfig;
