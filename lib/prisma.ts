import { PrismaClient } from "@prisma/client";

// 環境変数がundefinedの場合にデフォルト値を設定
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 開発環境でのホットリロードによる複数接続を防止するためのシングルトンパターン
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
