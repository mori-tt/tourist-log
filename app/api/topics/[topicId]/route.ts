import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ topicId: number }> }
) {
  try {
    const { topicId } = await params;
    const data = await req.json();
    const updatedTopic = await prisma.topic.update({
      where: { id: Number(topicId) },
      data,
    });
    return NextResponse.json(updatedTopic);
  } catch (error) {
    console.error("トピック更新に失敗しました:", error);
    return NextResponse.json(
      { error: "トピック更新に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;
    const id = Number(topicId);

    // 関連する記事の有無を確認
    const relatedArticles = await prisma.article.findMany({
      where: { topicId: id },
    });

    // 関連する記事がある場合は、購入済みでないものだけを更新
    if (relatedArticles.length > 0) {
      // 記事のtopicIdをnullに更新
      await prisma.article.updateMany({
        where: {
          topicId: id,
          isPurchased: false,
        },
        data: { topicId: null },
      });
    }

    // トピックを削除
    const deletedTopic = await prisma.topic.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "トピックを削除しました",
      topic: deletedTopic,
    });
  } catch (error) {
    console.error("トピック削除に失敗しました:", error);
    return NextResponse.json(
      { error: `トピック削除に失敗しました: ${error}` },
      { status: 500 }
    );
  }
}
