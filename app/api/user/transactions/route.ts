import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // ログインチェック
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ユーザーIDを型付きで取得
    const userId = session.user.id;

    // ユーザーの取引履歴を取得
    // 1. ユーザーが購入した記事の取引
    // 2. ユーザーが投稿した記事の取引
    // 3. ユーザーが広告主の場合、広告料支払いの取引

    // 先にユーザーの記事IDを取得
    const userArticles = await prisma.article.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
      },
    });

    const userArticleIds = userArticles.map((article) => article.id);

    // ユーザーが広告主のトピックIDを取得
    const userTopics = await prisma.topic.findMany({
      where: {
        advertiserId: userId,
      },
      select: {
        id: true,
      },
    });

    const userTopicIds = userTopics.map((topic) => topic.id);

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { userId: userId }, // ユーザーが購入した記事の取引
          {
            articleId: {
              in: userArticleIds.length > 0 ? userArticleIds : [-1],
            },
          }, // ユーザーが投稿した記事の取引
          {
            topicId: {
              in: userTopicIds.length > 0 ? userTopicIds : [-1],
            },
          }, // ユーザーが広告主の場合の広告料支払い
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 記事IDとトピックIDを抽出
    const articleIds = transactions
      .map((t) => t.articleId)
      .filter((id): id is number => id !== null);

    const topicIds = transactions.map((t) => t.topicId).filter(Boolean);

    // 関連する記事とトピックを取得
    const [articles, topics] = await Promise.all([
      prisma.article.findMany({
        where: {
          id: { in: articleIds.length > 0 ? articleIds : [-1] },
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
          id: { in: topicIds.length > 0 ? topicIds : [-1] },
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

    // トランザクションと関連データを結合
    const transactionsWithDetails = transactions.map((transaction) => ({
      ...transaction,
      article: transaction.articleId
        ? articles.find((a) => a.id === transaction.articleId) || null
        : null,
      topic: transaction.topicId
        ? topics.find((t) => t.id === transaction.topicId) || null
        : null,
    }));

    return NextResponse.json({ transactions: transactionsWithDetails });
  } catch (error) {
    console.error("Failed to fetch user transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch user transactions" },
      { status: 500 }
    );
  }
}
