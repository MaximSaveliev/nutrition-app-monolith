import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Image Configuration
   * 
   * Allow images from Supabase storage
   */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'owpnfvlxwtaphbhosugb.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  /**
   * API Route Rewrites
   * 
   * Development: Proxy /api/* requests to local FastAPI backend (port 8000)
   * Production: Vercel handles routing via vercel.json - no rewrites needed
   * 
   * This allows frontend to call /api/auth/login in both environments without
   * hardcoding URLs or dealing with CORS in development.
   */
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8000/api/:path*",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;

