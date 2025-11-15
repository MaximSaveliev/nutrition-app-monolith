import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

