import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendRewardTransaction } from "@/utils/symbol";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { advertiserWalletPrivateKey, recipientAddress, adFee, topicId } =
      data;

    // 実際の送金処理を呼び出す
    const transactionResponse = await sendRewardTransaction(
      advertiserWalletPrivateKey,
      recipientAddress,
      adFee
    );

    // トランザクション履歴をDBに記録 (prisma.schema に Transaction モデルを追加する必要あり)
    const transactionRecord = await prisma.transaction.create({
      data: {
        topicId,
        adFee,
        transactionHash: transactionResponse.transactionInfo.hash,
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
