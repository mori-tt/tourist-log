import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const isAdmin = session.user?.isAdmin;
    if (!isAdmin) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    // 全てのトランザクションを取得
    const transactions = await prisma.transaction.findMany({
      select: {
        id: true,
        type: true,
        xymAmount: true,
        transactionHash: true,
        createdAt: true,
        articleId: true,
        topicId: true,
        userId: true,
        metadata: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 関連する記事とトピックの情報を取得
    const articleIds = transactions
      .map((t) => t.articleId)
      .filter((id): id is number => id !== null);
    const topicIds = transactions.map((t) => t.topicId);

    const [articles, topics] = await Promise.all([
      prisma.article.findMany({
        where: {
          id: { in: articleIds },
        },
        select: {
          id: true,
          title: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.topic.findMany({
        where: {
          id: { in: topicIds },
        },
        select: {
          id: true,
          title: true,
          advertiser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    // ユーザー情報を取得
    const userIds = transactions
      .map((t) => t.userId)
      .filter((id): id is string => id !== null);
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // トランザクションに記事とトピックの情報を結合
    const transactionsWithDetails = transactions.map((transaction) => ({
      ...transaction,
      article: transaction.articleId
        ? articles.find((a) => a.id === transaction.articleId)
        : null,
      topic: topics.find((t) => t.id === transaction.topicId),
      user: transaction.userId
        ? users.find((u) => u.id === transaction.userId)
        : null,
    }));

    return NextResponse.json(transactionsWithDetails);
  } catch (error) {
    console.error("トランザクション履歴の取得に失敗しました:", error);
    return NextResponse.json(
      { error: "トランザクション履歴の取得に失敗しました" },
      { status: 500 }
    );
  }
}
