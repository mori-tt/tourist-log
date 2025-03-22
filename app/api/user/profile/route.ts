import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (sessionError) {
      console.error("セッション取得エラー:", sessionError);
      return NextResponse.json({ error: "Session error" }, { status: 500 });
    }

    // ログインチェック
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ユーザー情報をレスポンス
    console.log(`ユーザー情報取得リクエスト: ID=${session.user.id}`);

    // 最新のユーザー情報をDBから取得
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          walletAddress: true,
          isAdvertiser: true,
          isAdmin: true,
        },
      });

      if (dbUser) {
        const userInfo = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          walletAddress: dbUser.walletAddress || null,
          symbolAddress: dbUser.walletAddress || null,
          isAdvertiser: dbUser.isAdvertiser || false,
          isAdmin: dbUser.isAdmin || false,
        };

        console.log(`返却するユーザー情報:`, userInfo);
        return NextResponse.json(userInfo);
      }
    } catch (dbError) {
      console.error("DB取得エラー:", dbError);
      // DBエラー時はセッションの情報だけで続行
    }

    // DBからの取得に失敗した場合はセッション情報のみを返す
    const userInfo = {
      id: session.user.id,
      name: session.user.name || "",
      email: session.user.email || "",
      walletAddress: null,
      symbolAddress: null,
      isAdvertiser: session.user.isAdvertiser || false,
      isAdmin: session.user.isAdmin || false,
    };

    console.log(`セッション情報から取得したユーザー情報:`, userInfo);
    return NextResponse.json(userInfo);
  } catch (error) {
    console.error("ユーザープロファイル取得でエラーが発生しました:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
