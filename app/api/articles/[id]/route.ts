import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // params を await してから利用
    const { id } = await Promise.resolve(params);
    const data = await req.json();
    const { images, ...rest } = data;
    const updatedArticle = await prisma.article.update({
      where: { id: Number(id) },
      data: {
        ...rest,
        // 画像情報が送信されている場合、既存の画像を一旦全削除して新たに登録
        ...(images !== undefined && {
          images: {
            deleteMany: {},
            create: images.map((item: { url: string }) => ({ url: item.url })),
          },
        }),
      },
      include: { images: true },
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
