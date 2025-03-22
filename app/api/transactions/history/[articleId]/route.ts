import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// https://nextjs.org/docs/app/building-your-application/routing/route-handlers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  try {
    // ログイン状態を確認
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // パラメータのバリデーション
    const articleId = parseInt((await params).articleId);
    if (isNaN(articleId)) {
      return NextResponse.json(
        { error: "Invalid article ID" },
        { status: 400 }
      );
    }

    // 記事の存在確認
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { user: true },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const authorId = article.userId;

    console.log(
      `記事ID=${articleId}の取引履歴を取得します。著者ID=${authorId}`
    );

    // 記事に関連する取引を取得
    const transactions = await prisma.transaction.findMany({
      where: {
        articleId: articleId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`取得したトランザクション: ${transactions.length}件`);

    // トランザクションのユーザーIDを収集
    const userIds = transactions
      .map((t) => t.userId)
      .filter((id): id is string => id !== null);

    // メタデータからもユーザーIDを収集
    const allUserIds = new Set<string>(userIds);
    transactions.forEach((tx) => {
      if (tx.metadata) {
        try {
          const meta = JSON.parse(tx.metadata);
          if (meta.authorId) allUserIds.add(meta.authorId);
          if (meta.purchaserId) allUserIds.add(meta.purchaserId);
          if (meta.recipientId) allUserIds.add(meta.recipientId);
        } catch {
          console.log(`メタデータのパースに失敗: ${tx.metadata}`);
        }
      }
    });

    const uniqueUserIds = Array.from(allUserIds);

    // 関連するユーザー情報を取得
    const users = await prisma.user.findMany({
      where: {
        id: { in: uniqueUserIds },
      },
      select: {
        id: true,
        name: true,
        walletAddress: true,
      },
    });

    // ユーザーIDからユーザー情報にアクセスするためのマップを作成
    const userMap = new Map();
    users.forEach((user) => {
      userMap.set(user.id, user);
    });

    // トランザクションにユーザー情報とフラグを追加
    const transactionsWithDetails = transactions.map((transaction) => {
      // ユーザー情報を取得
      const user = transaction.userId
        ? userMap.get(transaction.userId) || null
        : null;

      // 著者として受け取った取引の場合は、isReceivedフラグを設定
      const isAuthorTransaction =
        // ケース1: 著者IDが一致するトランザクション
        (transaction.userId === authorId &&
          (transaction.type === "purchase" ||
            transaction.type === "tip" ||
            transaction.type === "receive_tip")) ||
        // ケース2: メタデータに著者または受取人として記録されている
        (transaction.metadata &&
          (transaction.metadata.includes(`"authorId":"${authorId}"`) ||
            transaction.metadata.includes(`"recipientId":"${authorId}"`))) ||
        // ケース3: 記事のauthorIdとトランザクションの関連付け
        (transaction.metadata &&
          transaction.xymAmount > 0 &&
          article.userId === authorId);

      // 著者情報と購入者情報をメタデータから抽出して追加
      let authorUser = null;
      let purchaserUser = null;

      if (transaction.metadata) {
        try {
          const meta = JSON.parse(transaction.metadata);

          // 著者情報の取得
          if (meta.authorId && userMap.has(meta.authorId)) {
            authorUser = userMap.get(meta.authorId);
          } else if (meta.authorName) {
            authorUser = { id: meta.authorId || null, name: meta.authorName };
          }

          // 購入者情報の取得
          if (meta.purchaserId && userMap.has(meta.purchaserId)) {
            purchaserUser = userMap.get(meta.purchaserId);
          } else if (meta.purchaserName) {
            purchaserUser = {
              id: meta.purchaserId || null,
              name: meta.purchaserName,
            };
          }
        } catch {
          console.log(`メタデータのパースに失敗: ${transaction.id}`);
        }
      }

      // 著者情報がなければ記事の著者情報を使用
      if (!authorUser && article.user) {
        authorUser = {
          id: article.user.id,
          name: article.user.name,
        };
      }

      // 購入者情報がなければトランザクションのユーザー情報を使用
      if (!purchaserUser && user) {
        purchaserUser = user;
      }

      // 結果のトランザクションオブジェクトを構築
      const result = {
        ...transaction,
        user,
        article: {
          id: article.id,
          title: article.title,
          user: article.user,
        },
        // 著者として受け取った取引の場合は、isReceivedを設定
        isReceived: transaction.isReceived || isAuthorTransaction,
        // 追加情報
        authorUser,
        purchaserUser,
      };

      if (isAuthorTransaction || transaction.isReceived) {
        console.log(
          `著者用トランザクション: id=${transaction.id}, type=${transaction.type}, amount=${transaction.xymAmount}`
        );
      }

      return result;
    });

    // 合計金額の計算（著者として受け取ったXYMの合計）
    const totalReceivedXym = transactionsWithDetails
      .filter(
        (tx) =>
          tx.isReceived ||
          tx.authorUser?.id === authorId ||
          (tx.article?.user?.id === authorId && tx.xymAmount > 0)
      )
      .reduce((sum, tx) => sum + tx.xymAmount, 0);

    console.log(`著者 ${authorId} の受取XYM合計: ${totalReceivedXym}`);

    return NextResponse.json({
      transactions: transactionsWithDetails,
      totalReceivedXym,
      authorId,
    });
  } catch (error) {
    console.error("Failed to fetch transaction history:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction history" },
      { status: 500 }
    );
  }
}
