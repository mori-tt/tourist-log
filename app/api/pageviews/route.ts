import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

// PV数の一覧を取得するエンドポイント
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const isAdmin = session.user?.isAdmin;
    const isAdvertiser = session.user?.isAdvertiser;

    // 取得条件を設定
    let whereCondition = {};
    if (isAdvertiser && !isAdmin) {
      // 広告主の場合、自分のトピックのPVのみ取得
      whereCondition = {
        topic: {
          advertiserId: session.user.id,
        },
      };
    }

    const pageViews = await prisma.monthlyPageView.findMany({
      where: whereCondition,
      include: {
        topic: {
          select: {
            title: true,
            adFee: true,
            monthlyPVThreshold: true,
            advertiser: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json(pageViews);
  } catch (error) {
    console.error("PV数の取得に失敗しました:", error);
    return NextResponse.json(
      { error: "PV数の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PV数を登録・更新するエンドポイント
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const isAdmin = session.user?.isAdmin;
    const isAdvertiser = session.user?.isAdvertiser;

    if (!isAdmin && !isAdvertiser) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const data = await req.json();
    const { topicId, year, month, pageViews } = data;

    // トピックの存在確認
    const topic = await prisma.topic.findUnique({
      where: { id: Number(topicId) },
    });

    if (!topic) {
      return NextResponse.json(
        { error: "トピックが存在しません" },
        { status: 404 }
      );
    }

    // 広告主の場合、自分のトピックのみ更新可能
    if (isAdvertiser && !isAdmin && topic.advertiserId !== session.user.id) {
      return NextResponse.json(
        { error: "このトピックの更新権限がありません" },
        { status: 403 }
      );
    }

    // 現在の日付を取得
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScriptの月は0から始まる

    // 先月のデータかどうかチェック
    const isLastMonth =
      (year === currentYear && month === currentMonth - 1) ||
      (year === currentYear - 1 && month === 12 && currentMonth === 1);

    // 先月のデータでない場合はエラー
    if (!isLastMonth && !isAdmin) {
      return NextResponse.json(
        { error: "先月のPV数のみ入力可能です" },
        { status: 400 }
      );
    }

    // 入力期限チェック（管理者以外は5日までに入力）
    if (!isAdmin && now.getDate() > 5) {
      return NextResponse.json(
        { error: "PV数の入力期限（翌月5日）を過ぎています" },
        { status: 400 }
      );
    }

    // PVデータのupsert（存在しない場合は作成、存在する場合は更新）
    const result = await prisma.monthlyPageView.upsert({
      where: {
        topicId_year_month: {
          topicId: Number(topicId),
          year: Number(year),
          month: Number(month),
        },
      },
      update: {
        pageViews: Number(pageViews),
        isConfirmed: true,
        confirmedAt: new Date(),
      },
      create: {
        topicId: Number(topicId),
        year: Number(year),
        month: Number(month),
        pageViews: Number(pageViews),
        isConfirmed: true,
        confirmedAt: new Date(),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("PV数の更新に失敗しました:", error);
    return NextResponse.json(
      { error: "PV数の更新に失敗しました" },
      { status: 500 }
    );
  }
}
