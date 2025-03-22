import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import type { Transaction, TransactionType } from "@prisma/client";

// メタデータオブジェクトの型定義
type MetadataObject = Record<string, string | number | boolean | null>;

// メタデータから特定のプロパティ値を安全に取得するユーティリティ関数
function getMetadataValue(
  metadata: string | MetadataObject | null,
  key: string
): string | null {
  if (!metadata) return null;

  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata);
      return parsed[key] || null;
    } catch {
      // JSONパースに失敗した場合は文字列検索
      return metadata.includes(`"${key}":"`)
        ? metadata.split(`"${key}":"`)[1]?.split('"')[0] || null
        : null;
    }
  } else if (metadata && typeof metadata === "object") {
    return metadata[key]?.toString() || null;
  }

  return null;
}

export async function GET() {
  try {
    // セッション取得部分をtry-catchで囲む
    let session;
    try {
      session = await getServerSession(authOptions);

      // ログインチェック
      if (!session?.user) {
        console.log("未認証のユーザーがトランザクションAPIにアクセスしました");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } catch (sessionError) {
      console.error("セッション取得でエラーが発生:", sessionError);
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      );
    }

    // ユーザーIDを型付きで取得
    const userId = session.user.id;
    console.log(`取引履歴取得: ユーザーID=${userId}`);

    // ユーザーのすべての記事IDを取得
    const userArticles = await prisma.article.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
      },
    });
    const userArticleIds = userArticles.map((article) => article.id);

    // ユーザーが広告主である場合のトピックIDを取得
    const advertiserTopics = await prisma.topic.findMany({
      where: {
        advertiserId: userId,
      },
      select: {
        id: true,
      },
    });
    const userTopicIds = advertiserTopics.map((topic) => topic.id);

    // ユーザーが広告主かどうかの確認
    const isAdvertiser = userTopicIds.length > 0;
    console.log(`ユーザー ${userId} は広告主か: ${isAdvertiser}`);
    console.log(`広告主のトピックIDs: ${userTopicIds.join(", ")}`);

    // ユーザーテーブルから広告主フラグも取得
    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdvertiser: true },
    });

    // データベースのユーザー情報から広告主フラグを取得
    const isUserAdvertiser = userInfo?.isAdvertiser || false;

    // どちらかのフラグがtrueなら広告主として扱う
    const isCombinedAdvertiser = isAdvertiser || isUserAdvertiser;

    console.log(`ユーザー ${userId} のDB広告主フラグ: ${isUserAdvertiser}`);
    console.log(`ユーザー ${userId} の最終広告主判定: ${isCombinedAdvertiser}`);

    // トランザクション取得条件を構築
    const conditions = [];

    // ユーザーが直接関わるトランザクション
    conditions.push({
      userId: userId,
    });

    // ユーザーが著者の記事に関連するトランザクション
    if (userArticleIds.length > 0) {
      conditions.push({
        articleId: {
          in: userArticleIds,
        },
      });
    }

    // ユーザーが広告主のトピックに関連するトランザクション
    if (userTopicIds.length > 0) {
      conditions.push({
        topicId: {
          in: userTopicIds,
        },
      });
    }

    // 広告主のケースでは、支払いトランザクションも確実に含める
    // 広告主が支払った購入、チップ、広告支払いトランザクション
    if (isCombinedAdvertiser) {
      conditions.push({
        AND: [
          { userId: userId },
          {
            type: {
              in: [
                "purchase",
                "tip",
                "ad_payment",
                "advertisement",
              ] as TransactionType[],
            },
          },
        ],
      });
    }

    // トランザクション一覧を取得
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: conditions,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`取得したトランザクション数: ${transactions.length}`);

    // 重複を排除するためのIDセット
    const processedIds = new Set<number>();

    // 重複のないトランザクションリスト
    const uniqueTransactions = transactions.filter((tx) => {
      if (processedIds.has(tx.id)) {
        return false;
      }
      processedIds.add(tx.id);
      return true;
    });

    console.log(`重複排除後のトランザクション数: ${uniqueTransactions.length}`);

    // 広告主の場合はトランザクションタイプの内訳を表示
    if (isCombinedAdvertiser) {
      const typeCounts = uniqueTransactions.reduce(
        (acc: { [key: string]: number }, tx) => {
          const txType = tx.type as string;
          acc[txType] = (acc[txType] || 0) + 1;
          return acc;
        },
        {}
      );
      console.log(`広告主の取引タイプ内訳:`, typeCounts);
    }

    // 記事IDとトピックIDを抽出
    const articleIds = uniqueTransactions
      .map((t) => t.articleId)
      .filter((id): id is number => id !== null);

    const topicIds = uniqueTransactions.map((t) => t.topicId).filter(Boolean);

    // トランザクションから関連するユーザーIDを収集
    const allUserIds = new Set<string>();

    // 直接関係するユーザーを追加
    uniqueTransactions.forEach((tx) => {
      if (tx.userId) allUserIds.add(tx.userId);

      // メタデータからユーザーIDを抽出して追加
      if (tx.metadata) {
        try {
          const meta = JSON.parse(
            typeof tx.metadata === "string"
              ? tx.metadata
              : JSON.stringify(tx.metadata)
          );
          if (meta.authorId) allUserIds.add(meta.authorId);
          if (meta.purchaserId) allUserIds.add(meta.purchaserId);
          if (meta.recipientId) allUserIds.add(meta.recipientId);
        } catch {
          console.log(`メタデータのパースに失敗: ${tx.id}`);
        }
      }
    });

    const userIds = Array.from(allUserIds).filter((id) => id && id !== "");
    console.log(`関連ユーザーID: ${userIds.join(", ")}`);

    // 関連する記事、トピック、ユーザーを取得
    const [articles, topics, users] = await Promise.all([
      prisma.article.findMany({
        where: {
          id: { in: articleIds.length > 0 ? articleIds : [-1] },
        },
        select: {
          id: true,
          title: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              walletAddress: true,
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
              walletAddress: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        where: {
          id: { in: userIds.length > 0 ? userIds : [""] },
        },
        select: {
          id: true,
          name: true,
          walletAddress: true,
        },
      }),
    ]);

    console.log(`取得した記事数: ${articles.length}`);
    console.log(`取得したトピック数: ${topics.length}`);
    console.log(`取得したユーザー数: ${users.length}`);

    // ユーザーIDから情報を素早く検索するためのマップ
    const userMap = new Map();
    users.forEach((user) => {
      userMap.set(user.id, user);
    });

    // 記事IDから情報を素早く検索するためのマップ
    const articleMap = new Map();
    articles.forEach((article) => {
      articleMap.set(article.id, article);
    });

    // トピックIDから情報を素早く検索するためのマップ
    const topicMap = new Map();
    topics.forEach((topic) => {
      topicMap.set(topic.id, topic);
    });

    // トランザクションと関連データを結合
    const transactionsWithDetails = uniqueTransactions.map((transaction) => {
      // 関連する記事を取得
      const article = transaction.articleId
        ? articleMap.get(transaction.articleId) || null
        : null;

      // メタデータから情報を抽出
      const extractedData: Record<string, string | null> = {};

      // 著者情報を取得
      let authorId = null;
      let authorName = null;
      if (article?.user) {
        authorId = article.user.id;
        authorName = article.user.name;
      }

      // 購入者情報を取得
      let purchaserId = null;
      let purchaserName = null;
      if (transaction.userId) {
        const user = userMap.get(transaction.userId);
        if (user) {
          purchaserId = user.id;
          purchaserName = user.name;
        }
      }

      // 著者と購入者の情報をセット
      let authorUser: {
        id: string;
        name: string | null;
        walletAddress?: string | null;
      } | null = authorId
        ? {
            id: authorId,
            name: authorName,
          }
        : null;

      let purchaserUser: {
        id: string;
        name: string | null;
        walletAddress?: string | null;
      } | null = purchaserId
        ? {
            id: purchaserId,
            name: purchaserName,
          }
        : null;

      // 著者情報と購入者情報をメタデータから抽出して追加
      if (transaction.metadata) {
        try {
          const metadata =
            typeof transaction.metadata === "string"
              ? JSON.parse(transaction.metadata)
              : transaction.metadata || {};
          const extractedData = metadata;

          // getMetadataValue関数を使用してメタデータから特定の値を取得
          const metaAuthorId = getMetadataValue(extractedData, "authorId");
          const metaAuthorName = getMetadataValue(extractedData, "authorName");
          const metaPurchaserId = getMetadataValue(
            extractedData,
            "purchaserId"
          );
          const metaPurchaserName = getMetadataValue(
            extractedData,
            "purchaserName"
          );

          // 著者情報の取得（優先順位：メタデータ → ユーザーマップ）
          if (metaAuthorId) {
            if (userMap.has(metaAuthorId)) {
              authorUser = userMap.get(metaAuthorId);
            } else if (metaAuthorName) {
              // ウォレットアドレスを取得するためにユーザー検索を実行
              const authorInfo = users.find((u) => u.id === metaAuthorId);
              authorUser = {
                id: metaAuthorId,
                name: metaAuthorName,
                walletAddress: authorInfo?.walletAddress || null,
              };
            }
          }

          // 購入者情報の取得（優先順位：メタデータ → ユーザーマップ）
          if (metaPurchaserId) {
            if (userMap.has(metaPurchaserId)) {
              purchaserUser = userMap.get(metaPurchaserId);
            } else if (metaPurchaserName) {
              // ウォレットアドレスを取得するためにユーザー検索を実行
              const purchaserInfo = users.find((u) => u.id === metaPurchaserId);
              purchaserUser = {
                id: metaPurchaserId,
                name: metaPurchaserName,
                walletAddress: purchaserInfo?.walletAddress || null,
              };
            }
          }

          // authorIdが見つからない場合はメタデータから抽出
          if (!authorId && transaction.metadata) {
            try {
              const metadataObj =
                typeof transaction.metadata === "string"
                  ? JSON.parse(transaction.metadata)
                  : transaction.metadata;
              const tempAuthorId = metadataObj.authorId;
              const tempAuthorName = metadataObj.authorName;
              const tempPurchaserId = metadataObj.purchaserId;
              const tempPurchaserName = metadataObj.purchaserName;

              // 値が存在する場合のみ代入
              if (tempAuthorId) authorId = tempAuthorId;
              if (tempAuthorName) authorName = tempAuthorName;
              if (tempPurchaserId) purchaserId = tempPurchaserId;
              if (tempPurchaserName) purchaserName = tempPurchaserName;
            } catch {
              console.log(
                `トランザクション ${transaction.id} のメタデータ解析に失敗`
              );
              // エラーが発生しても処理を続行
            }
          }
        } catch {
          console.log(`メタデータのパース処理中にエラー: ${transaction.id}`);
        }
      }

      // 記事から著者情報を取得（メタデータになければ）
      if (!authorUser && article?.userId) {
        if (userMap.has(article.userId)) {
          authorUser = userMap.get(article.userId);
        } else {
          // 記事の著者情報をユーザーデータから直接検索
          const articleAuthor = users.find((u) => u.id === article.userId);
          if (articleAuthor) {
            authorUser = articleAuthor;
          }
        }
      }

      // トランザクションタイプが購入またはチップ関連の場合、記事IDから著者を取得
      if (
        !authorUser &&
        ((transaction.type as string) === "purchase" ||
          (transaction.type as string) === "tip" ||
          (transaction.type as string) === "ad_revenue") &&
        transaction.articleId
      ) {
        // 記事IDから記事情報を取得
        const articleData = articleMap.get(transaction.articleId);
        if (articleData?.userId) {
          if (userMap.has(articleData.userId)) {
            authorUser = userMap.get(articleData.userId);
          } else {
            // ユーザーデータから直接検索
            const relatedAuthor = users.find(
              (u) => u.id === articleData.userId
            );
            if (relatedAuthor) {
              authorUser = relatedAuthor;
            }
          }
        }
      }

      // トランザクションのユーザーIDが著者IDと一致し、ad_revenueの場合
      if (
        !authorUser &&
        (transaction.type as string) === "ad_revenue" &&
        transaction.userId
      ) {
        if (userMap.has(transaction.userId)) {
          authorUser = userMap.get(transaction.userId);
        }
      }

      // トランザクションのユーザーIDから購入者情報を取得（メタデータになければ）
      if (
        !purchaserUser &&
        transaction.userId &&
        transaction.userId !== article?.userId
      ) {
        if (userMap.has(transaction.userId)) {
          purchaserUser = userMap.get(transaction.userId);
        } else {
          const transactionUser = users.find(
            (u) => u.id === transaction.userId
          );
          if (transactionUser) {
            purchaserUser = transactionUser;
          }
        }
      }

      // 結果のトランザクションオブジェクトを構築
      const result = {
        ...transaction,
        article: article
          ? {
              ...article,
              // 記事に著者情報が含まれていなければ追加
              user: article.user || authorUser || null,
            }
          : null,
        topic: transaction.topicId
          ? topicMap.get(transaction.topicId) || null
          : null,
        user: transaction.userId
          ? userMap.get(transaction.userId) || null
          : null,
        // 著者として受け取った取引の場合は、isReceivedを設定
        isReceived:
          transaction.isReceived ||
          isAuthorRelated(transaction, userId, userArticleIds),
        // 追加情報
        authorUser: authorUser,
        purchaserUser: purchaserUser,
        // メタデータから抽出したデータ
        extractedData,
      };

      // デバッグ用：著者関連のトランザクションの場合
      if (
        isAuthorRelated(transaction, userId, userArticleIds) ||
        transaction.isReceived
      ) {
        console.log(
          `著者用トランザクション: id=${transaction.id}, type=${
            transaction.type
          }, amount=${transaction.xymAmount}, authorName=${
            authorUser?.name || "不明"
          }`
        );
      }

      return result;
    });

    // ユーザーの合計残高を計算
    // 受取XYM、支払いXYM、残高を個別に計算する
    let totalReceivedXym = 0;
    let totalPaidXym = 0;

    // 受取の場合のみここでカウント（プラスの金額）
    for (const transaction of uniqueTransactions) {
      try {
        if (transaction.xymAmount > 0) {
          totalReceivedXym += parseFloat(transaction.xymAmount.toString());
        }
      } catch {
        console.log(`トランザクション ${transaction.id} の金額解析に失敗`);
        // エラーが発生しても処理を続行
      }
    }

    // 支払いXYM額を計算（マイナスの取引額の絶対値）
    for (const transaction of uniqueTransactions) {
      const txType = transaction.type as string;

      // 広告主の支払いデバッグ情報
      console.log(
        `支払い計算確認: TX ID=${transaction.id}, Type=${txType}, Amount=${
          transaction.xymAmount
        }, userId=${
          transaction.userId
        }, isAdvertiser=${isCombinedAdvertiser}, topicIds=${userTopicIds.join(
          ","
        )}`
      );

      // 広告主のトピックに関連する支払い（広告主の支払いとして計上）
      if (
        isCombinedAdvertiser &&
        transaction.topicId &&
        userTopicIds.includes(transaction.topicId) &&
        (txType === "purchase" ||
          txType === "tip" ||
          txType === "ad_payment" ||
          txType === "advertisement")
      ) {
        const amount = Math.abs(transaction.xymAmount);
        console.log(
          `広告主のトピック関連支払いとして計上: ${amount} XYM (${txType}), トピックID=${transaction.topicId}, トランザクションID=${transaction.id}`
        );
        totalPaidXym += amount;
        continue; // このトランザクションは処理済みとしてスキップ
      }

      // 広告主が直接支払った場合（userId = 広告主ID）
      if (
        isCombinedAdvertiser &&
        transaction.userId === userId &&
        (txType === "purchase" ||
          txType === "tip" ||
          txType === "ad_payment" ||
          txType === "advertisement")
      ) {
        const amount = Math.abs(transaction.xymAmount);
        console.log(
          `広告主の直接支払いとして計上: ${amount} XYM (${txType}), トランザクションID=${transaction.id}`
        );
        totalPaidXym += amount;
        continue; // このトランザクションは処理済みとしてスキップ
      }

      // 通常の支払い（マイナスの取引）をカウント
      if (transaction.xymAmount < 0 && transaction.userId === userId) {
        const amount = Math.abs(transaction.xymAmount);
        console.log(`通常の支払いとして計上: ${amount} XYM (${txType})`);
        totalPaidXym += amount;
      }
    }

    // 現在の残高 = 受取 - 支払い
    const currentBalance = totalReceivedXym - totalPaidXym;

    console.log(
      `ユーザー ${userId} の取引履歴: ${uniqueTransactions.length}件取得`
    );
    console.log(`ユーザー ${userId} の総受取XYM: ${totalReceivedXym}`);
    console.log(`ユーザー ${userId} の総支払いXYM: ${totalPaidXym}`);
    console.log(`ユーザー ${userId} の現在の残高: ${currentBalance} XYM`);

    return NextResponse.json({
      transactions: transactionsWithDetails,
      totalPages: 1,
      totalReceivedXym,
      totalPaidXym,
      currentBalance,
      isAdvertiser: isCombinedAdvertiser, // 広告主フラグをレスポンスに含める
    });
  } catch (e) {
    console.error("取引履歴取得中にエラーが発生しました:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

function isAuthorRelated(
  transaction: Transaction,
  userId: string,
  userArticleIds: number[]
): boolean {
  const txType = transaction.type as string;

  if (txType === "ad_revenue" && transaction.userId === userId) {
    return true;
  }
  if (
    txType === "purchase" &&
    transaction.articleId &&
    userArticleIds.includes(transaction.articleId)
  ) {
    return true;
  }
  if (
    txType === "tip" &&
    transaction.articleId &&
    userArticleIds.includes(transaction.articleId)
  ) {
    return true;
  }
  return false;
}
