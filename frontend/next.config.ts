import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    // Only rewrite in development - in production, Vercel handles routing
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8000/api/:path*", // Proxy to Backend
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
