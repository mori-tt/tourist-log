import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // セッション取得とログイン確認
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // リクエストボディからウォレットアドレスを取得
    const { walletAddress } = await req.json();

    // バリデーション（オプション）
    if (walletAddress && typeof walletAddress !== "string") {
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 }
      );
    }

    // Symbolアドレスの簡易バリデーション
    // より柔軟な正規表現 - 一般的なSymbolアドレス形式にマッチ
    if (
      walletAddress &&
      !/^[A-Z0-9]{6}(-[A-Z0-9]{6}){5}(-[A-Z0-9]{3,6})?$/.test(walletAddress)
    ) {
      return NextResponse.json(
        { error: "Invalid Symbol address format" },
        { status: 400 }
      );
    }

    // ユーザーのウォレットアドレスを更新
    await prisma.user.update({
      where: { id: session.user.id },
      data: { walletAddress },
    });

    return NextResponse.json({
      success: true,
      message: "Wallet address updated successfully",
    });
  } catch (error) {
    console.error("ウォレットアドレス更新エラー:", error);
    return NextResponse.json(
      { error: "Failed to update wallet address" },
      { status: 500 }
    );
  }
}
