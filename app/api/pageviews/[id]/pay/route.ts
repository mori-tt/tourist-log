import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { sendXYMTransaction } from "@/utils/symbol";

// PV広告料支払い処理のPOSTエンドポイント
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { params } = await context;
    const { id } = await params;
    const pageViewId = parseInt(id, 10);

    if (isNaN(pageViewId)) {
      return NextResponse.json(
        { error: "無効なページビューIDです" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const isAdmin = session.user?.isAdmin;
    const isAdvertiser = session.user?.isAdvertiser;

    if (!isAdvertiser && !isAdmin) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const data = await request.json();
    const { privateKey } = data;

    if (!privateKey) {
      return NextResponse.json(
        { error: "ウォレットの秘密鍵が必要です" },
        { status: 400 }
      );
    }

    // PV情報を取得
    const pageView = await prisma.monthlyPageView.findUnique({
      where: { id: pageViewId },
      include: {
        topic: {
          select: {
            id: true,
            title: true,
            adFee: true,
            monthlyPVThreshold: true,
            advertiserId: true,
          },
        },
      },
    });

    if (!pageView) {
      return NextResponse.json(
        { error: "PV情報が見つかりません" },
        { status: 404 }
      );
    }

    // 広告主が自分のトピックのみ支払い可能かチェック
    if (
      isAdvertiser &&
      !isAdmin &&
      pageView.topic.advertiserId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "このトピックの支払い権限がありません" },
        { status: 403 }
      );
    }

    // 既に支払い済みかチェック
    if (pageView.isPaid) {
      return NextResponse.json(
        { error: "既に支払い済みです" },
        { status: 400 }
      );
    }

    // PV数がしきい値以上かチェック
    if (pageView.pageViews < pageView.topic.monthlyPVThreshold) {
      return NextResponse.json(
        { error: "PV数が支払い基準に達していません" },
        { status: 400 }
      );
    }

    // トピックに紐づく記事の投稿者を取得
    const articles = await prisma.article.findMany({
      where: {
        topicId: pageView.topic.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
          },
        },
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
    const paymentPerAuthor = pageView.topic.adFee / totalArticles;

    // 各投稿者への支払いを実行
    const paymentResults = [];
    const transactionHashes = [];

    for (const article of articles) {
      if (!article.user.walletAddress) {
        // ウォレットアドレスが設定されていない投稿者はスキップ
        paymentResults.push({
          userId: article.user.id,
          userName: article.user.name,
          status: "skipped",
          reason: "ウォレットアドレスが設定されていません",
        });
        continue;
      }

      // XYMの送金を実行
      try {
        const transactionResult = await sendXYMTransaction(
          privateKey,
          article.user.walletAddress,
          paymentPerAuthor,
          `PV広告料: ${pageView.topic.title} (${pageView.year}年${pageView.month}月)`
        );

        transactionHashes.push(transactionResult.hash);

        paymentResults.push({
          userId: article.user.id,
          userName: article.user.name,
          status: "success",
          transactionHash: transactionResult.hash,
          amount: paymentPerAuthor,
        });

        // トランザクション情報をDBに保存
        await prisma.transaction.create({
          data: {
            userId: session.user.id,
            type: "advertisement",
            xymAmount: paymentPerAuthor,
            transactionHash: transactionResult.hash,
            topicId: pageView.topic.id,
            adFee: pageView.topic.adFee,
            metadata: JSON.stringify({
              pageViewId: pageView.id,
              year: pageView.year,
              month: pageView.month,
              recipientId: article.user.id,
              recipientName: article.user.name,
            }),
          },
        });
      } catch (error) {
        console.error(
          `投稿者 ${article.user.id} への支払いに失敗しました:`,
          error
        );
        paymentResults.push({
          userId: article.user.id,
          userName: article.user.name,
          status: "failed",
          reason:
            error instanceof Error ? error.message : "支払い処理に失敗しました",
        });
      }
    }

    // 全ての支払いが完了したらPV情報を更新
    if (paymentResults.some((result) => result.status === "success")) {
      await prisma.monthlyPageView.update({
        where: { id: pageViewId },
        data: {
          isPaid: true,
          paidAt: new Date(),
          transactionHash: transactionHashes.join(","),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "PV広告料の支払いが完了しました",
      paymentResults,
    });
  } catch (error) {
    console.error("PV広告料支払い処理に失敗しました:", error);
    return NextResponse.json(
      {
        error: "PV広告料支払い処理に失敗しました",
        message:
          error instanceof Error ? error.message : "不明なエラーが発生しました",
      },
      { status: 500 }
    );
  }
}
