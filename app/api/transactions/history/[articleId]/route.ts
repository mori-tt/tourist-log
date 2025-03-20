import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// https://nextjs.org/docs/app/building-your-application/routing/route-handlers
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ articleId: string }> }
) {
  try {
    const { params } = await context;
    const { articleId } = await params;
    const articleIdNumber = parseInt(articleId, 10);

    if (isNaN(articleIdNumber)) {
      return NextResponse.json({ error: "無効な記事IDです" }, { status: 400 });
    }

    // 記事のトピックIDを取得
    const article = await prisma.article.findUnique({
      where: { id: articleIdNumber },
      select: { topicId: true, id: true },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // トランザクション履歴を取得
    // 特定の記事に関連するトランザクションのみを取得する
    const transactions = await prisma.transaction.findMany({
      where: {
        topicId: article.topicId || 0,
        // 記事購入や投げ銭など、この記事に直接関連するトランザクションのみに絞り込む
        OR: [
          { articleId: articleIdNumber },
          // articleIdフィールドがない場合の後方互換性のため、
          // 記事IDをメタデータとして含むトランザクションも検索
          { metadata: { contains: `"articleId":${articleIdNumber}` } },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("取引履歴の取得に失敗しました:", error);
    return NextResponse.json(
      { error: "取引履歴の取得に失敗しました" },
      { status: 500 }
    );
  }
}
