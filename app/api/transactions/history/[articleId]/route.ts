import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

// Next.js 15の型チェックを通過する形式
export async function GET(request: Request) {
  try {
    // URLからパラメータを抽出（標準のWeb APIアプローチ）
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const articleIdStr = pathParts[pathParts.length - 1];
    const articleId = Number(articleIdStr);

    // セッションからユーザー情報を取得
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    if (isNaN(articleId)) {
      return NextResponse.json({ error: "記事IDが無効です" }, { status: 400 });
    }

    // 記事情報を取得
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return NextResponse.json(
        { error: "記事が見つかりません" },
        { status: 404 }
      );
    }

    // 記事の所有者またはアプリ管理者のみが取引履歴を取得可能
    if (article.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: "この操作を行う権限がありません" },
        { status: 403 }
      );
    }

    // 記事に関連する取引履歴を取得（Prismaスキーマに合わせて調整）
    // Prismaのテーブル構造に合わせてクエリを調整する必要があります
    const transactions = await prisma.$queryRaw`
      SELECT * FROM "Transaction"
      WHERE "articleId" = ${articleId}
      ORDER BY "createdAt" DESC
    `;

    // PVに基づく広告収益の推定値を計算
    const viewCount = article.viewCount || 0;
    const pvRevenue = Math.floor(viewCount * 0.01);

    return NextResponse.json({
      success: true,
      transactions: transactions,
      pvRevenue: pvRevenue,
    });
  } catch (error) {
    console.error("取引履歴の取得エラー:", error);
    return NextResponse.json(
      { error: "取引履歴の取得中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
