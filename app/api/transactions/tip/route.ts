import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import symbolService from "@/lib/symbolService";
import { TransactionType } from "@prisma/client";

// GETメソッド：DB から「type」が "tip" の取引一覧を取得
export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { type: "tip" },
    });
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("投げ銭取引取得エラー:", error);
    return NextResponse.json(
      { error: "投げ銭取引の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POSTメソッド：投げ銭送金及び DB 登録処理（type:"tip"）
export async function POST(req: Request) {
  try {
    // ログインチェック
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "認証されていません" },
        { status: 401 }
      );
    }

    // リクエストボディの取得
    const body = await req.json();
    const { articleId, amount, tipAmount, message } = body;

    // 金額パラメータの統一（amountまたはtipAmountのどちらかを使用）
    const actualAmount = amount || tipAmount;

    // 必須フィールドの検証
    if (!articleId) {
      return NextResponse.json(
        { error: "記事IDが指定されていません" },
        { status: 400 }
      );
    }

    if (!actualAmount || actualAmount <= 0) {
      return NextResponse.json(
        { error: "投げ銭金額は正の値である必要があります" },
        { status: 400 }
      );
    }

    // 記事のIDと投げ銭送信者のIDを取得
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        user: true, // 著者情報も取得
        topic: { include: { advertiser: true } }, // トピックと広告主の情報も取得
      },
    });

    // 記事が存在しない場合はエラー
    if (!article) {
      return NextResponse.json(
        { error: "指定された記事が見つかりません" },
        { status: 404 }
      );
    }

    // トピック情報の確認
    if (!article.topicId || !article.topic) {
      return NextResponse.json(
        { error: "記事のトピック情報が不足しています" },
        { status: 400 }
      );
    }

    // 広告主（トピックの作成者）の情報
    const advertiser = article.topic.advertiser;
    if (!advertiser) {
      return NextResponse.json(
        { error: "トピックの広告主情報が不足しています" },
        { status: 400 }
      );
    }

    // 投げ銭送信者のID
    const senderId = session.user.id;
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
    });

    // 投げ銭送信者が存在しない場合はエラー
    if (!sender) {
      return NextResponse.json(
        { error: "送信者情報が見つかりません" },
        { status: 404 }
      );
    }

    // 著者のID
    const authorId = article.userId;
    const author = article.user;

    // 著者が存在しない場合はエラー
    if (!author) {
      return NextResponse.json(
        { error: "記事の著者情報が見つかりません" },
        { status: 404 }
      );
    }

    // 投げ銭送信者と著者が同じ場合はエラー
    if (senderId === authorId) {
      return NextResponse.json(
        { error: "自分の記事には投げ銭できません" },
        { status: 400 }
      );
    }

    // 各参加者のウォレットアドレスの検証
    if (!sender.walletAddress) {
      return NextResponse.json(
        { error: "送信者のウォレットアドレスが設定されていません" },
        { status: 400 }
      );
    }

    if (!advertiser.walletAddress) {
      return NextResponse.json(
        { error: "広告主のウォレットアドレスが設定されていません" },
        { status: 400 }
      );
    }

    if (!author.walletAddress) {
      return NextResponse.json(
        { error: "著者のウォレットアドレスが設定されていません" },
        { status: 400 }
      );
    }

    // Symbolアドレスの形式検証
    if (
      !symbolService.validateAddress(sender.walletAddress) ||
      !symbolService.validateAddress(advertiser.walletAddress) ||
      !symbolService.validateAddress(author.walletAddress)
    ) {
      return NextResponse.json(
        { error: "無効なウォレットアドレスが含まれています" },
        { status: 400 }
      );
    }

    // 投げ銭送信者の残高を取得
    const senderSymbolAddress = sender.walletAddress;
    const senderXymBalance = await symbolService.getBalance(
      senderSymbolAddress
    );

    // 投げ銭送信者の残高が足りない場合はエラー
    if (senderXymBalance < actualAmount) {
      return NextResponse.json(
        { error: "残高が不足しています" },
        { status: 400 }
      );
    }

    console.log(
      `投げ銭処理: 送信者=${senderId}, 著者=${authorId}, 記事=${articleId}, 金額=${actualAmount}`
    );

    // 広告主の残高を取得
    const advertiserXymBalance = await symbolService.getBalance(
      advertiser.walletAddress
    );

    // 広告主の残高が足りない場合はエラー
    if (advertiserXymBalance < actualAmount) {
      return NextResponse.json(
        { error: "広告主のXYM残高が不足しています" },
        { status: 400 }
      );
    }

    // XYM転送処理（広告主から著者へ）
    let txHash = "";
    try {
      // Symbolブロックチェーンで送金実行（広告主から著者へ）
      const result = await symbolService.sendTransaction(
        advertiser.walletAddress,
        author.walletAddress,
        actualAmount
      );
      txHash = result.txHash;

      console.log(
        `XYM送金成功: 広告主(${advertiser.id})から著者(${author.id})へ ${actualAmount}XYM`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "XYM送金処理に失敗しました";
      console.error("XYM送金失敗:", error);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    // トランザクションをデータベースに記録
    try {
      // 投げ銭送信者のトランザクションを作成（チップリクエスト記録のみ）
      const senderTransaction = await prisma.transaction.create({
        data: {
          type: "tip",
          xymAmount: 0, // 送信者はXYMを支払わない（広告主が支払う）
          topicId: article.topicId,
          adFee: 0,
          transactionHash: txHash,
          userId: senderId,
          articleId: articleId,
          metadata: JSON.stringify({
            message: message,
            articleTitle: article.title,
            authorId: authorId,
            authorName: author.name,
            purchaserId: senderId,
            purchaserName: sender.name,
            advertiserId: advertiser.id,
            advertiserName: advertiser.name,
          }),
        },
      });

      console.log(`送信者トランザクション作成: id=${senderTransaction.id}`);

      // 広告主への入金トランザクション（広告主視点での支払い）
      await prisma.transaction.create({
        data: {
          type: "ad_payment" as TransactionType,
          xymAmount: -actualAmount, // 広告主の視点では支出
          topicId: article.topicId,
          adFee: 0,
          transactionHash: txHash,
          userId: advertiser.id, // 広告主のIDを設定
          articleId: articleId,
          isReceived: false, // 支払いなので受取フラグは立てない
          metadata: JSON.stringify({
            message: message,
            articleTitle: article.title,
            authorId: authorId,
            authorName: author.name,
            advertiserId: advertiser.id,
            advertiserName: advertiser.name,
          }),
        },
      });

      // 著者への入金トランザクション（著者視点での受け取り）
      await prisma.transaction.create({
        data: {
          type: "receive_tip" as TransactionType,
          xymAmount: actualAmount, // 著者の視点では収入
          topicId: article.topicId,
          adFee: 0,
          transactionHash: txHash,
          userId: authorId, // 著者のIDを設定
          articleId: articleId,
          isReceived: true, // 受取トランザクション
          metadata: JSON.stringify({
            message: message,
            articleTitle: article.title,
            authorId: authorId,
            authorName: author.name,
            purchaserId: senderId,
            purchaserName: sender.name,
            advertiserId: advertiser.id,
            advertiserName: advertiser.name,
          }),
        },
      });

      // レスポンスを作成して返す
      return NextResponse.json({
        success: true,
        txHash: txHash,
        transactionId: senderTransaction.id,
        message: "投げ銭が成功しました",
      });
    } catch (dbError) {
      console.error("トランザクション記録エラー:", dbError);
      return NextResponse.json(
        {
          error: "送金は成功しましたが、データベースへの記録に失敗しました",
          txHash: txHash,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("投げ銭処理エラー:", error);
    const errorMessage =
      error instanceof Error ? error.message : "投げ銭処理に失敗しました";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
