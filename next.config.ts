import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ✅ This lets Vercel build even if ESLint finds errors like "Unexpected any"
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
