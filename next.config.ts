import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ibb.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ibb.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "image.ibb.co",
        pathname: "/**",
      },
    ],
    // domains設定は非推奨なので削除
    minimumCacheTTL: 60, // キャッシュ時間を1分に短縮して頻繁に更新
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp"],
    dangerouslyAllowSVG: true, // SVGを許可
    unoptimized: true, // Nextによる画像最適化を無効化（imgBBは既に最適化済み）
  },
};

export default nextConfig;
