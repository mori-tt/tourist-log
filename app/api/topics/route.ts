import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET リクエスト：全トピックを取得
export async function GET(req: Request) {
  try {
    const topics = await prisma.topic.findMany();
    return NextResponse.json(topics);
  } catch (error) {
    console.error("Failed to load topics:", error);
    return NextResponse.json(
      { error: "Failed to load topics" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { title, content, topicId, author } = data;

    const newArticle = await prisma.article.create({
      data: {
        title,
        content,
        topicId,
        author,
      },
    });

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    console.error("Failed to create article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
