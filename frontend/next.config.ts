import type { NextConfig } from "next";

const backendOrigin = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    dangerouslyAllowSVG: true,
    unoptimized: true,
  },
  async rewrites() {
    return [
      // Proxy backend API + uploads to avoid CORS and localhost-in-production issues.
      {
        source: "/uploads/:path*",
        destination: `${backendOrigin}/uploads/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
      {
        source: "/profile",
        destination: "/home/routes/profile",
      },
      {
        source: "/post",
        destination: "/home/routes/post",
      },
      {
        source: "/post/create",
        destination: "/home/routes/post/create",
      },
    ];
  },
};

export default nextConfig;
