import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.ibb.co",
        pathname: "**",
      },
    ],
    domains: ["i.ibb.co", "image.ibb.co", "ibb.co"],
    minimumCacheTTL: 3600, // キャッシュ時間を1時間に延長
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // 様々なデバイスサイズに対応
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // より詳細な画像サイズオプション
  },
};

export default nextConfig;
