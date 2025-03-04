import { NextRequest, NextResponse } from "next/server";
import { checkTransactionStatus } from "@/utils/symbol";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ hash: string }> }
): Promise<Response> {
  try {
    const { params } = await context;
    const transactionHash = (await params).hash;
    const transaction = await checkTransactionStatus(transactionHash);

    if (!transaction) {
      return NextResponse.json(
        { status: "not_found", message: "トランザクションが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "confirmed",
      transaction: transaction,
      message: "トランザクションは確認済みです",
    });
  } catch (error) {
    console.error("トランザクション状態確認エラー:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "トランザクションの確認中にエラーが発生しました",
      },
      { status: 500 }
    );
  }
}
