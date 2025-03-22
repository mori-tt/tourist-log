import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

// このAPIエンドポイントの説明を追加
// 管理者用のトランザクション（取引履歴）のデータを取得するAPI

export async function GET(req: NextRequest) {
  try {
    // セッションチェック
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.isAdmin !== true) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // クエリパラメータを取得
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // トランザクションの総数を取得
    const totalCount = await prisma.transaction.count();

    // トランザクションデータを取得（ページネーション付き）
    const transactions = await prisma.transaction.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    // 記事IDとトピックIDのリストを作成
    const articleIds = transactions
      .filter((tx) => tx.articleId !== null)
      .map((tx) => Number(tx.articleId));

    const topicIds = transactions
      .filter((tx) => tx.topicId !== null)
      .map((tx) => tx.topicId);

    // 記事情報を取得
    const articles =
      articleIds.length > 0
        ? await prisma.article.findMany({
            where: {
              id: { in: articleIds },
            },
            include: {
              user: true,
            },
          })
        : [];

    // トピック情報を取得
    const topics =
      topicIds.length > 0
        ? await prisma.topic.findMany({
            where: {
              id: { in: topicIds },
            },
            include: {
              advertiser: true,
            },
          })
        : [];

    // ユーザーIDを収集
    const userIds = [
      ...new Set([
        ...transactions
          .filter((tx) => tx.userId !== null)
          .map((tx) => tx.userId as string),
      ]),
    ];

    // ユーザー情報を取得
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: {
              id: {
                in: userIds,
              },
            },
          })
        : [];

    // 各種マップを作成
    const articleMap = new Map(articles.map((a) => [a.id, a]));
    const topicMap = new Map(topics.map((t) => [t.id, t]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    // トランザクションデータを処理
    const processedTransactions = transactions.map((tx) => {
      const article = tx.articleId
        ? articleMap.get(Number(tx.articleId))
        : null;
      const topic = tx.topicId ? topicMap.get(tx.topicId) : null;
      const user = tx.userId ? userMap.get(tx.userId) : null;

      // 記事の著者ユーザー
      const authorUser = article?.user || null;

      // トピックの広告主ユーザー
      const advertiserUser = topic?.advertiser || null;

      return {
        ...tx,
        article,
        topic,
        user,
        authorUser,
        advertiserUser,
      };
    });

    return NextResponse.json({
      transactions: processedTransactions,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching admin transactions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
