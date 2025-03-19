import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

// ユーザーの役割を更新するAPI
export async function PATCH(req: NextRequest) {
  // URLからユーザーIDを取得
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const userId = pathSegments[pathSegments.length - 2]; // URLパスから取得

  if (!userId) {
    return NextResponse.json(
      { error: "ユーザーIDが必要です" },
      { status: 400 }
    );
  }

  try {
    // セッションからユーザー情報を取得して管理者かチェック
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    // リクエストボディから更新内容を取得
    const data = await req.json();
    const updateData: {
      isAdvertiser?: boolean;
      isAdmin?: boolean;
    } = {};

    // 更新対象のフィールドをチェック
    if (typeof data.isAdvertiser === "boolean") {
      updateData.isAdvertiser = data.isAdvertiser;
    }

    if (typeof data.isAdmin === "boolean") {
      updateData.isAdmin = data.isAdmin;
    }

    // データが空の場合はエラー
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "更新するデータがありません" },
        { status: 400 }
      );
    }

    // ユーザーの更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isAdvertiser: true,
        isAdmin: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("ユーザー役割更新エラー:", error);

    // Prismaのエラー型チェック
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "ユーザー役割の更新中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
