import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { title, content, topicId, author } = data;

    if (!author) {
      throw new Error("Author is required.");
    }

    const newArticle = await prisma.article.create({
      data: {
        title,
        content,
        topicId,
        author,
      },
    });

    if (!newArticle) {
      throw new Error("Article creation returned null.");
    }

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    console.error("Failed to create article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
