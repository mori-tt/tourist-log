import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { title, content, adFee, monthlyPVThreshold, advertiserId } = data;

    const newTopic = await prisma.topic.create({
      data: {
        title,
        content,
        adFee,
        monthlyPVThreshold,
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
