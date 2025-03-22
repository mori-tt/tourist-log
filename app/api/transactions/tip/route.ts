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
      { error: "Failed to fetch tip transactions" },
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // リクエストボディの取得
    const body = await req.json();
    const { articleId, amount, tipAmount, message } = body;

    // 金額パラメータの統一（amountまたはtipAmountのどちらかを使用）
    const actualAmount = amount || tipAmount;

    // 必須フィールドの検証
    if (!articleId) {
      return NextResponse.json(
        { error: "Missing required field: articleId" },
        { status: 400 }
      );
    }

    if (!actualAmount || actualAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount: Amount must be positive" },
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
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // トピック情報の確認
    if (!article.topicId || !article.topic) {
      return NextResponse.json(
        { error: "Article's topic information is missing" },
        { status: 400 }
      );
    }

    // 広告主（トピックの作成者）の情報
    const advertiser = article.topic.advertiser;
    if (!advertiser) {
      return NextResponse.json(
        { error: "Topic advertiser information is missing" },
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
      return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    }

    // 著者のID
    const authorId = article.userId;
    const author = article.user;

    // 著者が存在しない場合はエラー
    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    // 投げ銭送信者と著者が同じ場合はエラー
    if (senderId === authorId) {
      return NextResponse.json(
        { error: "You cannot tip your own article" },
        { status: 400 }
      );
    }

    // 投げ銭送信者のSymbolアドレスが登録されていない場合はエラー
    if (!sender.walletAddress) {
      return NextResponse.json(
        { error: "送信者のウォレットアドレスが見つかりません" },
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
        { error: "Insufficient XYM balance" },
        { status: 400 }
      );
    }

    console.log(
      `投げ銭処理: 送信者=${senderId}, 著者=${authorId}, 記事=${articleId}, 金額=${actualAmount}`
    );

    // XYM転送処理（広告主から著者へ）
    let txHash = "";
    try {
      // 広告主のSymbolアドレスが登録されていない場合はエラー
      if (!advertiser.walletAddress) {
        return NextResponse.json(
          { error: "広告主のウォレットアドレスが見つかりません" },
          { status: 400 }
        );
      }

      // 著者のSymbolアドレスが登録されていない場合はエラー
      if (!author.walletAddress) {
        return NextResponse.json(
          { error: "著者のウォレットアドレスが見つかりません" },
          { status: 400 }
        );
      }

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
      console.error("XYM送金失敗:", error);
      return NextResponse.json(
        { error: "XYM送金処理に失敗しました" },
        { status: 500 }
      );
    }

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

    // 著者への入金トランザクション（受け取り側）
    await prisma.transaction.create({
      data: {
        type: "ad_revenue" as TransactionType,
        xymAmount: actualAmount, // 著者の視点では収入
        topicId: article.topicId,
        adFee: 0,
        transactionHash: txHash,
        userId: authorId, // 著者のIDを明示的に設定
        articleId: articleId,
        isReceived: true, // 受取フラグを立てる
        metadata: JSON.stringify({
          message: message,
          articleTitle: article.title,
          authorId: authorId, // 著者IDを明示的に記録
          authorName: author.name,
          purchaserId: senderId,
          purchaserName: sender.name,
          advertiserId: advertiser.id,
          advertiserName: advertiser.name,
          recipientId: authorId, // 受取人IDとして著者ID
          paymentType: "article_tip", // 支払いタイプを明示的に記録
          articleId: articleId, // 記事IDも明示的に記録
        }),
      },
    });

    console.log(
      `著者 ${authorId} への入金トランザクション作成: 金額=${actualAmount}, 支払元=広告主(${advertiser.id}), 記事ID=${articleId}`
    );

    // レスポンスを返却
    return NextResponse.json({
      message: "Tip sent successfully",
      transaction: senderTransaction,
    });
  } catch (error) {
    console.error("Failed to send tip:", error);
    return NextResponse.json({ error: "Failed to send tip" }, { status: 500 });
  }
}
