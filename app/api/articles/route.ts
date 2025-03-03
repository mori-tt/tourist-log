import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

// GET リクエスト：記事一覧を取得（画像情報も含むように修正）
export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      include: {
        topic: true,
        user: true,
        images: true,
      },
    });
    return NextResponse.json(articles);
  } catch (error) {
    console.error("記事の取得に失敗しました:", error);
    return NextResponse.json(
      { error: "記事の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST リクエスト：記事を作成
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const {
      title,
      content,
      topicId,
      author,
      userId,
      tipAmount,
      purchaseAmount,
      images, // 画像情報はオブジェクト配列 [{ url: "https://..." }]
    } = data;

    if (!author || !userId) {
      throw new Error("Author and userId are required.");
    }
    if (!topicId) {
      throw new Error("Topic ID is required.");
    }
    const parsedTopicId = Number(topicId);
    if (isNaN(parsedTopicId) || parsedTopicId <= 0) {
      throw new Error("Topic ID is invalid.");
    }

    const newArticle = await prisma.article.create({
      data: {
        title,
        content,
        topicId: parsedTopicId,
        author,
        userId: userId.toString(),
        tipAmount,
        purchaseAmount,
        ...(images &&
          images.length > 0 && {
            images: {
              create: images.map((item: { url: string }) => ({
                url: item.url,
              })),
            },
          }),
      },
      include: {
        topic: true,
        user: true,
        images: true, // 新規作成時も画像情報を返す
      },
    });

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    console.error("記事の作成に失敗しました:", error);
    return NextResponse.json(
      { error: "記事の作成に失敗しました" },
      { status: 500 }
    );
  }
}
