import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET リクエスト：記事一覧を取得
export async function GET() {
  try {
    const articles = await prisma.article.findMany();
    return NextResponse.json(articles);
  } catch (error) {
    console.error("記事の取得に失敗しました:", error);
    return NextResponse.json(
      { error: "記事の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { title, content, topicId, author, userId } = data;

    if (!author || !userId) {
      throw new Error("Author and userId are required.");
    }

    const newArticle = await prisma.article.create({
      data: {
        title,
        content,
        topicId,
        author,
        user: { connect: { id: userId } },
      },
    });

    if (!newArticle) {
      throw new Error("Article creation returned null.");
    }

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    console.error("記事の作成に失敗しました:", error);
    return NextResponse.json(
      { error: "記事の作成に失敗しました" },
      { status: 500 }
    );
  }
}
