import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

// 管理者用ユーザー一覧を取得するAPI
export async function GET() {
  try {
    // セッションからユーザー情報を取得して管理者かチェック
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    // すべてのユーザーを取得
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        walletAddress: true,
        isAdvertiser: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("ユーザー一覧取得エラー:", error);
    return NextResponse.json(
      { error: "ユーザーデータの取得中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
