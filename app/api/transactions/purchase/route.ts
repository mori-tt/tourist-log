import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import symbolService from "@/lib/symbolService";
import type { TransactionType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    // ログインチェック
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // リクエストボディの取得
    const body = await req.json();
    const { articleId } = body;

    // 記事のIDが指定されていない場合はエラー
    if (!articleId) {
      return NextResponse.json(
        { error: "Missing required field: articleId" },
        { status: 400 }
      );
    }

    // 記事のIDを取得
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { topic: { include: { advertiser: true } } }, // トピックと広告主の情報も取得
    });
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // トピック情報の確認
    if (!article.topicId || !article.topic) {
      return NextResponse.json(
        { error: "Article's topic information is missing" },
        { status: 400 }
      );
    }

    // 広告主（トピックの作成者）の情報
    const advertiser = article.topic.advertiser;
    if (!advertiser) {
      return NextResponse.json(
        { error: "Topic advertiser information is missing" },
        { status: 400 }
      );
    }

    // 著者情報の取得（記事に直接含まれていないため別途取得）
    const author = await prisma.user.findUnique({
      where: { id: article.userId },
      select: { id: true, name: true, walletAddress: true },
    });
    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    // 購入者のID
    const purchaserId = session.user.id;
    const purchaser = await prisma.user.findUnique({
      where: { id: purchaserId },
    });

    // 購入者が存在しない場合はエラー
    if (!purchaser) {
      return NextResponse.json(
        { error: "Purchaser not found" },
        { status: 404 }
      );
    }

    // 購入者と著者が同じ場合はエラー
    if (purchaserId === author.id) {
      return NextResponse.json(
        { error: "You cannot purchase your own article" },
        { status: 400 }
      );
    }

    // 購入価格
    const price = article.xymPrice ?? 0;

    // 購入者のSymbolアドレスが登録されていない場合はエラー
    if (!purchaser.walletAddress) {
      return NextResponse.json(
        { error: "購入者のウォレットアドレスが見つかりません" },
        { status: 400 }
      );
    }

    // 購入者の残高を取得
    const purchaserSymbolAddress = purchaser.walletAddress;
    const purchaserXymBalance = await symbolService.getBalance(
      purchaserSymbolAddress
    );

    // 購入者の残高が足りない場合はエラー
    if (purchaserXymBalance < price) {
      return NextResponse.json(
        { error: "Insufficient XYM balance" },
        { status: 400 }
      );
    }

    console.log(
      `購入処理: 購入者=${purchaserId}, 著者=${author.id}, 記事=${articleId}, 価格=${price}`
    );

    // XYM転送処理（広告主から著者へ）
    let txHash = "";
    if (price > 0) {
      try {
        // 広告主のSymbolアドレスが登録されていない場合はエラー
        if (!advertiser.walletAddress) {
          return NextResponse.json(
            { error: "広告主のウォレットアドレスが見つかりません" },
            { status: 400 }
          );
        }

        // 著者のSymbolアドレスが登録されていない場合はエラー
        if (!author.walletAddress) {
          return NextResponse.json(
            { error: "著者のウォレットアドレスが見つかりません" },
            { status: 400 }
          );
        }

        // 広告主の残高を取得
        const advertiserXymBalance = await symbolService.getBalance(
          advertiser.walletAddress
        );

        // 広告主の残高が足りない場合はエラー
        if (advertiserXymBalance < price) {
          return NextResponse.json(
            { error: "広告主のXYM残高が不足しています" },
            { status: 400 }
          );
        }

        // SymbolブロックチェーンでXYM転送（広告主から著者へ）
        const result = await symbolService.sendTransaction(
          advertiser.walletAddress,
          author.walletAddress,
          price
        );
        txHash = result.txHash;

        console.log(
          `XYM送金成功: 広告主(${advertiser.id})から著者(${author.id})へ ${price}XYM`
        );
      } catch (error) {
        console.error("XYM転送エラー:", error);
        return NextResponse.json(
          { error: "XYM転送に失敗しました" },
          { status: 500 }
        );
      }
    }

    // 購入トランザクションを作成（購入者の記録）
    const purchaseTransaction = await prisma.transaction.create({
      data: {
        type: "purchase",
        xymAmount: 0, // 購入者はXYMを支払わない（広告主が支払う）
        topicId: article.topicId,
        adFee: 0,
        transactionHash: txHash,
        userId: purchaserId,
        articleId: article.id,
        metadata: JSON.stringify({
          articleTitle: article.title,
          authorId: article.userId,
          authorName: author.name,
          purchaserId: purchaserId,
          purchaserName: purchaser.name,
          advertiserId: advertiser.id,
          advertiserName: advertiser.name,
        }),
      },
    });

    console.log(`購入者トランザクション作成: id=${purchaseTransaction.id}`);

    // 広告主の支出トランザクションを作成
    if (price > 0) {
      await prisma.transaction.create({
        data: {
          type: "ad_payment" as TransactionType,
          xymAmount: -price,
          topicId: article.topicId,
          adFee: 0,
          transactionHash: txHash,
          userId: advertiser.id,
          articleId: article.id,
          metadata: JSON.stringify({
            articleTitle: article.title,
            authorId: article.userId,
            authorName: author.name,
            purchaserId: purchaserId,
            purchaserName: purchaser.name,
            advertiserId: advertiser.id,
            advertiserName: advertiser.name,
          }),
        },
      });

      console.log(
        `広告主支出トランザクション作成: 広告主=${
          advertiser.id
        }, 金額=${-price}`
      );
    }

    // 著者への入金トランザクション（受け取り側）
    if (price > 0) {
      await prisma.transaction.create({
        data: {
          type: "ad_revenue" as TransactionType,
          xymAmount: price,
          topicId: article.topicId,
          adFee: 0,
          transactionHash: txHash,
          userId: article.userId,
          articleId: article.id,
          isReceived: true,
          metadata: JSON.stringify({
            articleTitle: article.title,
            authorId: article.userId,
            authorName: author.name,
            purchaserId: purchaserId,
            purchaserName: purchaser.name,
            advertiserId: advertiser.id,
            advertiserName: advertiser.name,
            recipientId: article.userId,
            paymentType: "article_purchase",
            articleId: article.id,
          }),
        },
      });

      console.log(
        `著者 ${article.userId} への入金トランザクション作成: 金額=${price}, 支払元=広告主(${advertiser.id}), 記事ID=${article.id}`
      );
    }

    // 記事を購入済みに更新
    await prisma.article.update({
      where: { id: articleId },
      data: {
        isPurchased: true,
        purchasedBy: purchaserId,
      },
    });

    console.log(`記事ID=${articleId}を購入済みに更新, 購入者=${purchaserId}`);

    // 無料記事の場合の処理（将来的に実装を検討）
    if (price === 0) {
      // 将来的には実装を検討
    }

    // レスポンスを返却
    return NextResponse.json({
      message: "Article purchased successfully",
      transaction: purchaseTransaction,
    });
  } catch (error) {
    console.error("Failed to purchase article:", error);
    return NextResponse.json(
      { error: "Failed to purchase article" },
      { status: 500 }
    );
  }
}
