import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/profile",
        destination: "/home/routes/profile",
      },
    ];
  },
};

export default nextConfig;
