import NextAuth, { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

export async function PATCH(request: Request) {
  // 現在のセッション情報を取得（セッション情報はDBのユーザーデータに対応する情報）
  const session = await getServerSession(authOptions);

  // セッションが存在しない、またはユーザーのメール情報がない場合はエラーを返す
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "認証されていません" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, role } = body;

    // セッションから取得したメールアドレスでDB上のユーザーを特定し更新する
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        isActive: true, // サインアップ完了としてマーク
        isAdvertiser: role === "advertiser",
      },
    });

    return NextResponse.json({ updatedUser });
  } catch {
    return NextResponse.error();
  }
}
