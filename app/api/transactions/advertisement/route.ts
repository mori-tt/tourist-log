import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendRewardTransaction } from "@/utils/symbol";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { senderWalletPrivateKey, recipientAddress, tipAmount, topicId } =
      data;

    // Symbolブロックチェーンで投げ銭処理を実行
    const transactionResponse = await sendRewardTransaction(
      senderWalletPrivateKey,
      recipientAddress,
      tipAmount
    );

    // DBに取引履歴を記録（type:"tip" を設定）
    const transactionRecord = await prisma.transaction.create({
      data: {
        topicId: Number(topicId),
        adFee: 0, // tipの場合は広告料は0
        xymAmount: 0, // added to fulfill required field of TransactionCreateInput
        transactionHash: transactionResponse.transactionInfo.hash,
        type: "advertisement",
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
