import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Prisma, TransactionType } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const isReceivedParam = searchParams.get("isReceived");

    // クエリ条件を構築
    const queryConditions: Prisma.TransactionWhereInput = {};

    // type パラメータがある場合、フィルター
    if (type) {
      queryConditions.type = type as TransactionType;
    }

    // isReceived パラメータがある場合、フィルター
    if (isReceivedParam !== null) {
      const isReceived = isReceivedParam === "true";
      queryConditions.isReceived = isReceived;

      if (isReceived) {
        // 受け取ったトランザクションの場合、メタデータ内で自分が受信者として記録されているものを検索
        // または、関連記事の投稿者が自分であるものを検索
        queryConditions.OR = [
          { metadata: { contains: `"recipientId":"${userId}"` } },
        ];
      } else {
        // 送信したトランザクションの場合、自分が送信者として記録されているもの
        queryConditions.userId = userId;
      }
    } else {
      // どちらも指定がない場合は自分に関係するすべてのトランザクション
      queryConditions.OR = [
        { userId: userId },
        { metadata: { contains: `"recipientId":"${userId}"` } },
      ];
    }

    // トランザクションを取得
    const transactions = await prisma.transaction.findMany({
      where: queryConditions,
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
        isReceived: true,
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

    // ユーザー情報を取得
    const userIds = transactions
      .map((t) => t.userId)
      .filter((id): id is string => id !== null);

    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: {
              id: { in: userIds },
            },
            select: {
              id: true,
              name: true,
            },
          })
        : [];

    // トランザクションに記事とトピックの情報を結合
    const transactionsWithDetails = transactions.map((transaction) => ({
      ...transaction,
      article: transaction.articleId
        ? articles.find((a) => a.id === transaction.articleId) || null
        : null,
      topic: transaction.topicId
        ? topics.find((t) => t.id === transaction.topicId) || null
        : null,
      user: transaction.userId
        ? users.find((u) => u.id === transaction.userId) || null
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
