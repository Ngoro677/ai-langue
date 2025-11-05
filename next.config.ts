import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  // Ignorer les erreurs de polices pendant le build pour éviter les échecs de build
  experimental: {
    optimizePackageImports: ['next/font/google'],
  },
};

export default nextConfig;
