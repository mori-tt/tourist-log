import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendRewardTransaction } from "@/utils/symbol";
import { TransactionType } from "@prisma/client";

// GETメソッド：DB から「type」が "tip" の取引一覧を取得
export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { type: "tip" },
    });
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("投げ銭取引取得エラー:", error);
    return NextResponse.json(
      { error: "Failed to fetch tip transactions" },
      { status: 500 }
    );
  }
}

// POSTメソッド：投げ銭送金及び DB 登録処理（type:"tip"）
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

    // DBに取引履歴を記録
    const transactionRecord = await prisma.transaction.create({
      data: {
        topicId: topicId, // String型なのでキャスト不要
        adFee: 0, // Tipの場合は広告料は0
        transactionHash: transactionResponse.transactionInfo.hash,
        type: TransactionType.tip, // Enumを使用
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
