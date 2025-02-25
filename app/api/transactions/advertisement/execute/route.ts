import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendRewardTransaction } from "@/utils/symbol";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { advertiserWalletPrivateKey, articleId } = data;

    // 対象記事を取得（記事の著者情報と viewCount が必要）
    const article = await prisma.article.findUnique({
      where: { id: Number(articleId) },
      include: { user: true },
    });
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    if (!article.topicId) {
      return NextResponse.json(
        { error: "Article not associated with any topic" },
        { status: 400 }
      );
    }

    // Topic から月間PV閾値と広告料を取得
    const topic = await prisma.topic.findUnique({
      where: { id: Number(article.topicId) },
    });
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // ※ Article モデルに viewCount フィールドが存在すること
    if (article.viewCount < topic.monthlyPVThreshold) {
      return NextResponse.json(
        { error: "PV threshold not reached for ad fee payment" },
        { status: 400 }
      );
    }

    // 広告料の算出（topic.adFee を利用）
    const adFee = topic.adFee;

    // 送金先（記事著者）のウォレットアドレスチェック
    if (!article.user || !article.user.walletAddress) {
      return NextResponse.json(
        { error: "Article author's wallet address is not set" },
        { status: 400 }
      );
    }
    const recipientAddress = article.user.walletAddress;

    // Symbolブロックチェーンで送金実行
    const transactionResponse = await sendRewardTransaction(
      advertiserWalletPrivateKey,
      recipientAddress,
      adFee
    );

    // DBに送金トランザクション情報を記録
    const transactionRecord = await prisma.transaction.create({
      data: {
        topicId: Number(article.topicId),
        adFee,
        transactionHash: transactionResponse.transactionInfo.hash,
        type: "advertisement",
      },
    });

    return NextResponse.json({
      transaction: transactionRecord,
      blockchain: transactionResponse,
    });
  } catch (error) {
    console.error("広告料送金トランザクションエラー:", error);
    return NextResponse.json({ error: "Transaction failed" }, { status: 500 });
  }
}
