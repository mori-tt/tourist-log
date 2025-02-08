import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendRewardTransaction } from "@/utils/symbol";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { userWalletPrivateKey, recipientAddress, tipAmount, articleId } =
      data;

    // 投げ銭（Tip）の送金処理を実行
    const transactionResponse = await sendRewardTransaction(
      userWalletPrivateKey,
      recipientAddress,
      tipAmount
    );

    // トランザクション履歴をDBに記録
    const transactionRecord = await prisma.transaction.create({
      data: {
        articleId,
        tipAmount,
        transactionHash: transactionResponse.transactionInfo.hash,
      },
    });

    return NextResponse.json({
      transaction: transactionRecord,
      blockchain: transactionResponse,
    });
  } catch (error) {
    console.error("投げ銭トランザクションエラー:", error);
    return NextResponse.json({ error: "Transaction failed" }, { status: 500 });
  }
}
