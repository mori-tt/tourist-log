import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET リクエスト：全トピックを取得
export async function GET() {
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
    const { title, content, adFee, monthlyPVThreshold, advertiserId } = data;

    // 必須フィールドのチェック
    if (
      !title ||
      !content ||
      adFee === undefined ||
      monthlyPVThreshold === undefined ||
      !advertiserId
    ) {
      return NextResponse.json(
        { error: "必要なフィールドが存在しません" },
        { status: 400 }
      );
    }

    // 数値変換とチェック
    const _adFee = Number(adFee);
    const _monthlyPVThreshold = Number(monthlyPVThreshold);

    if (Number.isNaN(_adFee) || Number.isNaN(_monthlyPVThreshold)) {
      return NextResponse.json(
        { error: "adFeeまたはmonthlyPVThresholdの値が正しくありません" },
        { status: 400 }
      );
    }

    const newTopic = await prisma.topic.create({
      data: {
        title,
        content,
        adFee: _adFee,
        advertiserId,
      },
    });

    return NextResponse.json(newTopic, { status: 201 });
  } catch (error) {
    console.error("Failed to create topic:", error);
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 }
    );
  }
}
