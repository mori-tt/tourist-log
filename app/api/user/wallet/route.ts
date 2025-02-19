import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: 指定したユーザーのウォレットアドレスを取得（クエリパラメータ "userId" を利用）
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ walletAddress: user.walletAddress });
  } catch (error) {
    console.error("Wallet GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet address" },
      { status: 500 }
    );
  }
}

// POST: ユーザーのウォレットアドレスを登録／更新
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { walletAddress, userId } = data;

    // ユーザーのウォレットアドレスを更新
    const updatedUser = await prisma.user.update({
      where: { id: userId }, // String型なのでキャスト不要
      data: { walletAddress },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("ウォレットアドレス更新エラー:", error);
    return NextResponse.json(
      { error: "Failed to update wallet address" },
      { status: 500 }
    );
  }
}
