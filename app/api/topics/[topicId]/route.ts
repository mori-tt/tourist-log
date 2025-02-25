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
