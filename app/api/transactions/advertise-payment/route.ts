import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { sendRewardTransaction } from "@/utils/symbol";
import { PageViewData } from "@/context/ArticlesContext";

// 広告費支払い処理のPOSTエンドポイント
export async function POST(req: Request) {
  try {
    // デバッグ用：Prismaクライアントが持つプロパティ名を確認
    console.log("Prismaクライアントのプロパティ:", Object.keys(prisma));

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const isAdmin = session.user?.isAdmin;
    const isAdvertiser = session.user?.isAdvertiser;

    if (!isAdvertiser && !isAdmin) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const data = await req.json();
    const { advertiserWalletPrivateKey, pageViewId } = data;

    // PV情報を取得
    const pageViewResult = await prisma.$queryRaw`
      SELECT m.*, 
             t.title as "topicTitle", t.content as "topicContent", t."adFee", t."monthlyPVThreshold",
             a.id as "advertiserId", a.name as "advertiserName"
      FROM "MonthlyPageView" m
      JOIN "Topic" t ON m."topicId" = t.id
      JOIN "User" a ON t."advertiserId" = a.id
      WHERE m.id = ${Number(pageViewId)}
    `;

    // 取得したデータをオブジェクトに変換 - 型アサーションを追加
    const parsedPageView = (pageViewResult as PageViewData[])[0];
    if (!parsedPageView) {
      return NextResponse.json(
        { error: "PV情報が見つかりません" },
        { status: 404 }
      );
    }

    // 広告主が自分のトピックのみ支払い可能かチェック
    if (
      isAdvertiser &&
      !isAdmin &&
      parsedPageView.topic.advertiser.id !== Number(session.user.id)
    ) {
      return NextResponse.json(
        { error: "このトピックの支払い権限がありません" },
        { status: 403 }
      );
    }

    // 既に支払い済みかチェック
    if (parsedPageView.isPaid) {
      return NextResponse.json(
        { error: "既に支払い済みです" },
        { status: 400 }
      );
    }

    // 支払い日チェック（10日以降でないとエラー、ただし管理者は除く）
    const now = new Date();
    if (!isAdmin && now.getDate() < 10) {
      return NextResponse.json(
        { error: "支払い開始日（10日）になっていません" },
        { status: 400 }
      );
    }

    // PV数がしきい値以上かチェック
    if (parsedPageView.pageViews < parsedPageView.topic.monthlyPVThreshold) {
      return NextResponse.json(
        { error: "PV数が支払い基準に達していません" },
        { status: 400 }
      );
    }

    // トピックに紐づく記事の投稿者全員に支払う
    const articles = await prisma.article.findMany({
      where: {
        topicId: parsedPageView.topicId,
      },
      include: {
        user: true,
      },
      distinct: ["userId"], // 同じユーザーが複数の記事を投稿していても重複なし
    });

    if (articles.length === 0) {
      return NextResponse.json(
        { error: "このトピックには記事がありません" },
        { status: 400 }
      );
    }

    // 記事投稿者ごとの支払い金額を計算
    const totalArticles = articles.length;
    const paymentPerAuthor = parsedPageView.topic.adFee / totalArticles;

    // 各投稿者への支払いを実行
    const paymentResults = [];
    for (const article of articles) {
      if (!article.user.walletAddress) {
        continue; // ウォレットアドレスがない場合はスキップ
      }

      // Symbolブロックチェーンで送金実行
      try {
        const transactionResponse = await sendRewardTransaction(
          advertiserWalletPrivateKey,
          article.user.walletAddress,
          paymentPerAuthor
        );

        // 取引情報を記録
        // const transactionRecord = await prisma.transaction.create({
        //   data: {
        //     topicId: parsedPageView.topicId,
        //     adFee: paymentPerAuthor,
        //     xymAmount: paymentPerAuthor,
        //     transactionHash: transactionResponse.transactionInfo.hash,
        //     type: "advertisement",
        //   },
        // });

        paymentResults.push({
          userId: article.userId,
          amount: paymentPerAuthor,
          transactionHash: transactionResponse.transactionInfo.hash,
        });
      } catch (error) {
        console.error("支払い処理中にエラーが発生しました:", error);
        continue; // エラーが発生しても他の支払いは続行
      }
    }

    if (paymentResults.length === 0) {
      return NextResponse.json(
        { error: "支払い処理に失敗しました" },
        { status: 500 }
      );
    }

    // 支払い状態を更新
    await prisma.$executeRaw`
      UPDATE "MonthlyPageView"
      SET "isPaid" = true, "paidAt" = ${new Date()}
      WHERE id = ${parsedPageView.id}
    `;

    // 更新後のデータを再取得
    const updatedPageViewResult = await prisma.$queryRaw`
      SELECT * FROM "MonthlyPageView" WHERE id = ${parsedPageView.id}
    `;
    const updatedPageView = (updatedPageViewResult as PageViewData[])[0];

    return NextResponse.json({
      success: true,
      payments: paymentResults,
      paidCount: paymentResults.length,
      totalAuthors: totalArticles,
      pageView: updatedPageView,
    });
  } catch (error) {
    console.error("広告費支払い処理に失敗しました:", error);
    return NextResponse.json(
      { error: "広告費支払い処理に失敗しました" },
      { status: 500 }
    );
  }
}
