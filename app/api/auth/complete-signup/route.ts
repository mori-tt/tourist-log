import NextAuth, { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  console.log("取得したセッション:", session);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "認証されていません" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, role, walletAddress } = body;

    // ウォレットアドレスのバリデーション
    if (walletAddress && typeof walletAddress === "string") {
      // Symbolアドレスの簡易バリデーション
      const isValidAddress = /^[A-Z0-9]{6}(-[A-Z0-9]{6}){5,6}$/.test(
        walletAddress
      );
      if (!isValidAddress) {
        return NextResponse.json(
          { error: "無効なウォレットアドレス形式です" },
          { status: 400 }
        );
      }
    }

    // セッションから取得したメールアドレスでDB上のユーザーを特定し更新する
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        isActive: true, // サインアップ完了としてマーク
        isAdvertiser: role === "advertiser",
        walletAddress: walletAddress || null,
      },
    });

    return NextResponse.json({ updatedUser });
  } catch (error) {
    console.error("サインアップ完了エラー:", error);
    return NextResponse.json(
      { error: "サインアップ完了処理に失敗しました" },
      { status: 500 }
    );
  }
}
