import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

// トランザクションの状態を確認するエンドポイント
export async function GET(req: Request) {
  try {
    // セッションチェック
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "認証されていません" },
        { status: 401 }
      );
    }

    // URLからトランザクションIDを取得
    const url = new URL(req.url);
    const transactionId = url.searchParams.get("id");

    if (!transactionId) {
      return NextResponse.json(
        { error: "トランザクションIDが指定されていません" },
        { status: 400 }
      );
    }

    // トランザクションの状態を取得
    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(transactionId) },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "トランザクションが見つかりません" },
        { status: 404 }
      );
    }

    // トランザクションの状態を返す
    let status = "completed";
    let message = "処理が完了しました";
    if (transaction.metadata) {
      try {
        const metadata = JSON.parse(transaction.metadata);
        if (metadata.status) {
          status = metadata.status;
        }
        if (metadata.errorMessage) {
          message = metadata.errorMessage;
        } else if (metadata.message) {
          message = metadata.message;
        }
      } catch {
        // パースエラーは無視
      }
    }

    return NextResponse.json({
      id: transaction.id,
      status,
      message,
      type: transaction.type,
      xymAmount: transaction.xymAmount,
      transactionHash: transaction.transactionHash,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    });
  } catch (error) {
    console.error("トランザクション状態確認エラー:", error);
    return NextResponse.json(
      { error: "トランザクション状態の取得に失敗しました" },
      { status: 500 }
    );
  }
}
