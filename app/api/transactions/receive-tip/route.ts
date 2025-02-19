import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { transactionId } = await req.json();
    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId is required" },
        { status: 400 }
      );
    }

    // 該当取引が存在するか確認
    const transaction = await prisma.transaction.findUnique({
      where: { id: Number(transactionId) },
    });
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // 受領済みとしてマークする（isReceived フィールドを true に更新）
    const updatedTransaction = await prisma.transaction.update({
      where: { id: Number(transactionId) },
      data: { isReceived: true },
    });

    return NextResponse.json({ transaction: updatedTransaction });
  } catch (error) {
    console.error("受け取りエラー:", error);
    return NextResponse.json(
      { error: "受け取りに失敗しました" },
      { status: 500 }
    );
  }
}
