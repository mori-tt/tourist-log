import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { articleId, userEmail } = await req.json();
    // ここで、受け取り処理（受領済みとしてマークする、またはウォレット連携処理を実施）を行う
    // 例：dummyなトランザクションレコードを返す
    const transactionRecord = {
      id: 1,
      articleId,
      tipAmount: 100,
      transactionHash: "dummy-hash",
      type: "tip",
    };
    return NextResponse.json({ transaction: transactionRecord });
  } catch (error) {
    console.error("受け取りエラー:", error);
    return NextResponse.json(
      { error: "受け取りに失敗しました" },
      { status: 500 }
    );
  }
}
