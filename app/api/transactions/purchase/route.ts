import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendRewardTransaction } from "@/utils/symbol";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const {
      advertiserWalletPrivateKey,
      articleId,
      purchaseAmount,
      advertiserId,
    } = data;

    // 記事と著者情報を取得
    const article = await prisma.article.findUnique({
      where: { id: Number(articleId) },
      include: { user: true },
    });
    if (!article || !article.user) {
      return NextResponse.json(
        { error: "Article or associated user not found" },
        { status: 404 }
      );
    }

    // 購入金額が最低額（例: 10XYM）以上かチェック
    if (purchaseAmount < 10) {
      return NextResponse.json(
        { error: "Purchase amount is insufficient" },
        { status: 400 }
      );
    }

    // 既に購入済みの場合は中断
    if (article.isPurchased) {
      // 広告主がこの記事を購入していた場合、購入済みと表示するだけでエラーにしない
      if (article.purchasedBy === advertiserId) {
        return NextResponse.json(
          {
            message: "You have already purchased this article",
            isPurchased: true,
            purchasedByCurrentUser: true,
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: "Article has already been purchased" },
        { status: 400 }
      );
    }

    // 著者のウォレットアドレスを取得
    const recipientAddress = article.user.walletAddress;
    if (!recipientAddress) {
      return NextResponse.json(
        { error: "Recipient wallet address not set" },
        { status: 400 }
      );
    }

    // Symbolブロックチェーンで送金実行
    const transactionResponse = await sendRewardTransaction(
      advertiserWalletPrivateKey,
      recipientAddress,
      purchaseAmount
    );

    // 記事購入状態の更新（購入者IDを記録）
    const updatedArticle = await prisma.article.update({
      where: { id: Number(articleId) },
      data: {
        isPurchased: true,
        purchasedBy: advertiserId,
      },
    });

    // メタデータの準備
    const metadata = JSON.stringify({
      articleId: Number(articleId),
      purchaseAmount,
      purchaserId: advertiserId,
    });

    // 購入者用のトランザクション記録
    const purchaseTransaction = await prisma.transaction.create({
      data: {
        topicId: Number(article.topicId),
        adFee: purchaseAmount,
        xymAmount: purchaseAmount,
        transactionHash: transactionResponse.transactionInfo.hash,
        type: "purchase",
        userId: advertiserId,
        articleId: Number(articleId),
        metadata,
      },
    });

    // 記事投稿者用のトランザクション記録 (receive_tip タイプ)
    const receiverMetadata = JSON.stringify({
      articleId: Number(articleId),
      purchaseAmount,
      purchaserId: advertiserId,
      receiverId: article.userId,
    });

    const receiveTransaction = await prisma.transaction.create({
      data: {
        topicId: Number(article.topicId),
        adFee: purchaseAmount,
        xymAmount: purchaseAmount,
        transactionHash: transactionResponse.transactionInfo.hash,
        type: "receive_tip",
        userId: article.userId, // 投稿者のID
        articleId: Number(articleId),
        metadata: receiverMetadata,
        isReceived: true,
      },
    });

    return NextResponse.json({
      updatedArticle,
      purchaseTransaction,
      receiveTransaction,
      blockchain: transactionResponse,
    });
  } catch (error) {
    console.error("Article purchase transaction failed:", error);
    return NextResponse.json({ error: "Transaction failed" }, { status: 500 });
  }
}
