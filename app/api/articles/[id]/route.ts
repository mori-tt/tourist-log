import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await req.json();
    const updatedArticle = await prisma.article.update({
      where: { id: Number(id) },
      data,
    });
    return NextResponse.json(updatedArticle);
  } catch (error) {
    console.error("記事更新に失敗しました:", error);
    return NextResponse.json(
      { error: "記事更新に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json({ error: "権限がありません" }, { status: 401 });
  }

  try {
    const { id } = params;
    const deletedArticle = await prisma.article.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ deletedArticle });
  } catch (error) {
    console.error("削除に失敗しました:", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
