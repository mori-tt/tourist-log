import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ibb.co",
        pathname: "**",
      },
    ],
    domains: ["i.ibb.co"],
    minimumCacheTTL: 60,
  },
  /* config options here */
};

export default nextConfig;
