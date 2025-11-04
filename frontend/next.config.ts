import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API rewrites for backend integration
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://localhost:8000/api/:path*'
            : '/api/:path*',
      },
    ];
  },
  
  // Suppress the util._extend deprecation warning
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
