import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendRewardTransaction } from "@/utils/symbol";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { advertiserWalletPrivateKey, articleId, purchaseAmount } = data;

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

    // 購入金額が最低額（例: 1000円）以上かチェック
    if (purchaseAmount < 1000) {
      return NextResponse.json(
        { error: "Purchase amount is insufficient" },
        { status: 400 }
      );
    }

    // 既に購入済みの場合は中断
    if (article.isPurchased) {
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

    // 記事購入状態の更新
    const updatedArticle = await prisma.article.update({
      where: { id: Number(articleId) },
      data: { isPurchased: true },
    });

    // DBに取引情報を記録（購入時は tipAmount フィールドを購入額として利用）
    const transactionRecord = await prisma.transaction.create({
      data: {
        topicId: Number(article.topicId),
        adFee: purchaseAmount,
        transactionHash: transactionResponse.transactionInfo.hash,
        type: "purchase",
      },
    });

    return NextResponse.json({
      updatedArticle,
      transaction: transactionRecord,
      blockchain: transactionResponse,
    });
  } catch (error) {
    console.error("Article purchase transaction failed:", error);
    return NextResponse.json({ error: "Transaction failed" }, { status: 500 });
  }
}
