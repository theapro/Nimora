import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/uploads/**",
      },
    ],
    dangerouslyAllowSVG: true,
    unoptimized: true,
  },
  async rewrites() {
    return [
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
