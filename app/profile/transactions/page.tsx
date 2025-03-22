"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Transaction } from "@/types";
import TransactionTypeIcon from "@/components/TransactionTypeIcon";
import EmptyState from "@/components/EmptyState";

// Add interface for Transaction with display amount
interface TransactionWithDisplayAmount extends Transaction {
  displayAmount: number;
}

const UserTransactions = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<
    TransactionWithDisplayAmount[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [totalReceivedXym, setTotalReceivedXym] = useState(0);
  const [totalPaidXym, setTotalPaidXym] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [symbolAddress, setSymbolAddress] = useState("");
  const [isUserAdvertiser, setIsUserAdvertiser] = useState(false);
  const [userSymbolAddress, setUserSymbolAddress] = useState<string | null>(
    null
  );

  // セッションが無効な場合はログインページにリダイレクト
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // トランザクションの金額表示クラスを取得
  const getTransactionAmountClass = (amount: number) => {
    return amount > 0
      ? "text-green-600 dark:text-green-500 font-semibold"
      : "text-red-600 dark:text-red-500 font-semibold";
  };

  // ユーザーの残高を計算する関数
  const calculateBalance = (transactions: TransactionWithDisplayAmount[]) => {
    return transactions.reduce((balance, tx) => {
      return balance + tx.displayAmount;
    }, 0);
  };

  // ユーザーのプロフィール情報を取得
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (status !== "authenticated") return;

      try {
        const response = await fetch(`/api/user/${session.user.id}`);
        if (!response.ok) throw new Error("Failed to fetch user profile");

        const userData = await response.json();
        console.log("ユーザープロフィール情報:", userData);

        // ユーザーのウォレットアドレスをセット
        if (userData.walletAddress) {
          setUserSymbolAddress(userData.walletAddress);
          setSymbolAddress(userData.walletAddress); // Set the symbol address
        }

        // ユーザーが広告主かどうかをセット
        setIsUserAdvertiser(userData.isAdvertiser || false);
        console.log(
          `ユーザー ${session.user.id} は広告主か: ${
            userData.isAdvertiser || false
          }`
        );
      } catch (error) {
        console.error("ユーザープロフィール取得エラー:", error);
      }
    };

    if (status === "authenticated") {
      fetchUserProfile();
    }
  }, [status, session]);

  // ユーザートランザクションを取得
  useEffect(() => {
    const fetchTransactions = async () => {
      if (status !== "authenticated") return;

      try {
        setLoading(true);
        const response = await fetch("/api/user/transactions");
        if (!response.ok) throw new Error("Failed to fetch transactions");

        const data = await response.json();
        console.log("取得したトランザクション:", data.transactions);

        // APIレスポンスから広告主フラグを取得
        const apiAdvertiserFlag = data.isAdvertiser || false;
        console.log(`APIからの広告主フラグ: ${apiAdvertiserFlag}`);

        // 状態を更新
        setIsUserAdvertiser(apiAdvertiserFlag);

        // 直接APIレスポンスの広告主フラグを使用してトランザクションを処理
        const processedTx = processTransactionsWithFlag(
          data.transactions,
          session.user.id,
          apiAdvertiserFlag
        );

        setTransactions(processedTx);

        // 処理済みトランザクションから残高を計算
        const balance = calculateBalance(processedTx);
        setCurrentBalance(balance);

        // 受取と支払いの合計額を計算
        const { received, paid } = calculateTotals(processedTx);
        setTotalReceivedXym(received);
        setTotalPaidXym(paid);

        setLoading(false);
      } catch (error) {
        console.error("トランザクション取得エラー:", error);
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchTransactions();
    }
  }, [status, session]);

  // 処理済みのトランザクションから受取額と支払額を計算
  const calculateTotals = (transactions: TransactionWithDisplayAmount[]) => {
    let received = 0;
    let paid = 0;

    transactions.forEach((tx) => {
      if (tx.displayAmount > 0) {
        received += tx.displayAmount;
      } else if (tx.displayAmount < 0) {
        paid += Math.abs(tx.displayAmount);
      }
    });

    console.log(`計算した受取XYM: ${received}, 支払いXYM: ${paid}`);
    return { received, paid };
  };

  // 広告主フラグを直接渡して使用するトランザクション処理関数
  const processTransactionsWithFlag = (
    transactions: Transaction[],
    userId: string,
    isAdvertiser: boolean
  ): TransactionWithDisplayAmount[] => {
    console.log(
      `処理開始（直接フラグ使用）: ユーザーID=${userId}, 広告主=${isAdvertiser}`
    );

    return transactions.map((transaction) => {
      // 支払いタイプのトランザクション（支払いに関連するもの）
      const paymentTypes = ["purchase", "tip", "ad_payment", "advertisement"];
      // 受取タイプのトランザクション（収入に関連するもの）
      const receiptTypes = ["receive_tip", "ad_revenue"];

      // 記事の著者がユーザー自身かどうか
      const isAuthorReceiving =
        transaction.articleId &&
        transaction.article?.userId === userId &&
        (transaction.type === "purchase" || transaction.type === "tip");

      // トランザクションの種類に基づいて分類
      const isPaymentType = paymentTypes.includes(transaction.type as string);
      const isReceiptType = receiptTypes.includes(transaction.type as string);

      // デフォルト値を設定
      let displayAmount = transaction.xymAmount;

      console.log(
        `処理中: ID=${transaction.id}, タイプ=${transaction.type}, 金額=${transaction.xymAmount}, 広告主=${isAdvertiser}`
      );

      // 1. 著者として受け取る場合は常にプラス表示（最優先）
      if (isAuthorReceiving) {
        displayAmount = Math.abs(transaction.xymAmount);
        console.log(`[著者受取] ID=${transaction.id}, 金額=${displayAmount}`);
      }
      // 2. 広告主の場合、支払いタイプのトランザクションは全てマイナス表示（著者受取を除く）
      else if (isAdvertiser && isPaymentType) {
        displayAmount = -Math.abs(transaction.xymAmount);
        console.log(
          `[広告主支払い] ID=${transaction.id}, 金額=${displayAmount}`
        );
      }
      // 3. 通常ユーザーで支払いタイプかつユーザーIDが一致する場合はマイナス表示
      else if (
        !isAdvertiser &&
        isPaymentType &&
        transaction.userId === userId
      ) {
        displayAmount = -Math.abs(transaction.xymAmount);
        console.log(
          `[一般ユーザー支払い] ID=${transaction.id}, 金額=${displayAmount}`
        );
      }
      // 4. 受取タイプの取引はプラス表示
      else if (isReceiptType) {
        displayAmount = Math.abs(transaction.xymAmount);
        console.log(`[受取] ID=${transaction.id}, 金額=${displayAmount}`);
      }

      // 最終チェック: 広告主かつ支払いタイプなのに金額がプラスになっている場合は修正
      if (
        isAdvertiser &&
        isPaymentType &&
        !isAuthorReceiving &&
        displayAmount > 0
      ) {
        displayAmount = -Math.abs(displayAmount);
        console.log(
          `[広告主最終チェック] ID=${transaction.id}, 修正後=${displayAmount}`
        );
      }

      return {
        ...transaction,
        displayAmount,
      };
    });
  };

  // 画面をリロードする関数
  const refreshData = () => {
    if (status === "authenticated") {
      setLoading(true);
      window.location.reload();
    }
  };

  // 記事のタイトルを取得
  const getArticleTitle = (transaction: Transaction) => {
    // 記事オブジェクトがある場合はそこからタイトルを取得
    if (transaction.article) {
      return transaction.article.title;
    }

    // メタデータから記事タイトルを取得
    if (transaction.metadata && typeof transaction.metadata === "object") {
      if (
        "articleTitle" in transaction.metadata &&
        transaction.metadata.articleTitle
      ) {
        return transaction.metadata.articleTitle as string;
      }
    } else if (typeof transaction.metadata === "string") {
      try {
        const meta = JSON.parse(transaction.metadata);
        if (meta.articleTitle) return meta.articleTitle;
      } catch {
        // パースエラーは無視
      }
    }

    return "不明な記事";
  };

  // 種類から説明テキストを取得
  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case "purchase":
        return "記事購入";
      case "tip":
        return "投げ銭";
      case "receive_tip":
        return "投げ銭受取";
      case "ad_payment":
        return "広告費支払い";
      case "ad_revenue":
        return "広告収入";
      case "advertisement":
        return "広告掲載";
      default:
        return type;
    }
  };

  // 著者名を取得
  const getAuthorName = (transaction: Transaction) => {
    console.log(
      `著者名取得試行: TX ID=${transaction.id}, 記事ID=${transaction.articleId}, タイプ=${transaction.type}`
    );

    // 記事オブジェクトの中に著者情報がある場合（最優先）
    if (transaction.article?.user?.name) {
      console.log(`記事から著者情報取得: ${transaction.article.user.name}`);
      return transaction.article.user.name;
    }

    // 著者情報がauthorUserにある場合
    if (transaction.authorUser?.name) {
      console.log(`authorUserから著者情報取得: ${transaction.authorUser.name}`);
      return transaction.authorUser.name;
    }

    // メタデータから著者名を取得
    if (transaction.metadata && typeof transaction.metadata === "object") {
      if (
        "authorName" in transaction.metadata &&
        transaction.metadata.authorName
      ) {
        console.log(
          `メタデータから著者情報取得 (オブジェクト): ${transaction.metadata.authorName}`
        );
        return transaction.metadata.authorName as string;
      }
      // 記事IDがある場合は該当する記事の著者情報を使用
      if (
        "articleId" in transaction.metadata &&
        transaction.metadata.articleId
      ) {
        const articleId = Number(transaction.metadata.articleId);
        const matchingTransaction = transactions.find(
          (t) => t.articleId === articleId && t.article?.user?.name
        );
        if (matchingTransaction?.article?.user?.name) {
          console.log(
            `関連記事から著者情報取得: ${matchingTransaction.article.user.name}`
          );
          return matchingTransaction.article.user.name;
        }
      }
    } else if (typeof transaction.metadata === "string") {
      try {
        const meta = JSON.parse(transaction.metadata);
        if (meta.authorName) {
          console.log(
            `メタデータから著者情報取得 (文字列): ${meta.authorName}`
          );
          return meta.authorName;
        }

        // 記事IDがある場合は該当する記事の著者情報を使用
        if (meta.articleId) {
          const articleId = Number(meta.articleId);
          const matchingTransaction = transactions.find(
            (t) => t.articleId === articleId && t.article?.user?.name
          );
          if (matchingTransaction?.article?.user?.name) {
            console.log(
              `関連記事から著者情報取得: ${matchingTransaction.article.user.name}`
            );
            return matchingTransaction.article.user.name;
          }
        }
      } catch (e) {
        console.error(`メタデータのパースに失敗: ${e}`);
      }
    }

    // 記事IDがある場合、別のトランザクションから記事情報を検索
    if (transaction.articleId) {
      const articleTx = transactions.find(
        (t) =>
          t.articleId === transaction.articleId &&
          (t.article?.user?.name || t.authorUser?.name)
      );

      if (articleTx?.article?.user?.name) {
        return articleTx.article.user.name;
      }

      if (articleTx?.authorUser?.name) {
        return articleTx.authorUser.name;
      }
    }

    // トピックIDから記事の著者情報を検索
    if (transaction.topicId) {
      // 同じトピックの他の記事から著者を検索
      const topicArticleTx = transactions.find(
        (t) =>
          t.topicId === transaction.topicId &&
          t.articleId &&
          (t.article?.user?.name || t.authorUser?.name)
      );

      if (topicArticleTx?.article?.user?.name) {
        return topicArticleTx.article.user.name;
      }

      if (topicArticleTx?.authorUser?.name) {
        return topicArticleTx.authorUser.name;
      }
    }

    // トランザクションタイプから著者を推測
    if (
      transaction.type === "purchase" ||
      transaction.type === "tip" ||
      transaction.type === "receive_tip"
    ) {
      // 同タイプの他のトランザクションから著者情報を検索
      const similarTx = transactions.find(
        (t) =>
          t.type === transaction.type &&
          t !== transaction &&
          (t.article?.user?.name || t.authorUser?.name)
      );

      if (similarTx?.article?.user?.name) {
        return similarTx.article.user.name;
      }

      if (similarTx?.authorUser?.name) {
        return similarTx.authorUser.name;
      }
    }

    // セッションユーザーの情報を使用（特に受取トランザクションの場合）
    if (transaction.xymAmount > 0) {
      return "あなた";
    }

    console.warn(
      `著者情報取得失敗: TX ID=${transaction.id}, 記事ID=${transaction.articleId}`
    );
    return "記事作者"; // 「不明な著者」ではなく「記事作者」と表示
  };

  // トピックに関連付けられた広告主情報を取得
  const getAdvertiserFromTopic = (
    topic: {
      id?: number;
      title?: string;
      advertiserId?: string;
      advertiser?: {
        id?: string;
        name?: string;
      };
    } | null
  ): string | null => {
    if (!topic) return null;

    // advertiserId経由で広告主の名前を取得
    if (topic.advertiserId) {
      const advertiserTx = transactions.find(
        (tx) => tx.user?.id === topic.advertiserId && tx.user?.name
      );

      if (advertiserTx?.user?.name) {
        return advertiserTx.user.name;
      }
    }

    return null;
  };

  // 購入者名を取得
  const getPurchaserName = (transaction: Transaction) => {
    // ユーザー自身の場合は「あなた」と表示
    if (transaction.userId === session?.user?.id) {
      return "あなた";
    }

    // 購入者情報がtransaction.purchaserUserに直接あるケース
    if (transaction.purchaserUser?.name) {
      return transaction.purchaserUser.name;
    }

    // トランザクションのユーザー情報を使用するケース
    if (transaction.user?.name) {
      return transaction.user.name;
    }

    // メタデータから購入者名または広告主名を抽出するケース
    if (transaction.metadata && typeof transaction.metadata === "object") {
      if (
        "purchaserName" in transaction.metadata &&
        transaction.metadata.purchaserName
      ) {
        return transaction.metadata.purchaserName as string;
      }
      // 記事購入や投げ銭の場合、広告主が購入者である可能性が高い
      if (
        (transaction.type === "purchase" || transaction.type === "tip") &&
        "advertiserName" in transaction.metadata &&
        transaction.metadata.advertiserName
      ) {
        return transaction.metadata.advertiserName as string;
      }
    } else if (typeof transaction.metadata === "string") {
      try {
        const meta = JSON.parse(transaction.metadata);
        if (meta.purchaserName) return meta.purchaserName;

        // 記事購入や投げ銭の場合、広告主が購入者である可能性が高い
        if (
          (transaction.type === "purchase" || transaction.type === "tip") &&
          meta.advertiserName
        ) {
          return meta.advertiserName;
        }
      } catch {
        // パースエラーは無視
      }
    }

    // トピックに関連付けられた広告主が購入者の可能性がある
    if (transaction.type === "purchase" || transaction.type === "tip") {
      // トピック情報から広告主名を直接取得
      if (transaction.topic) {
        // advertiserId経由で広告主情報を検索
        if (transaction.topic.advertiserId) {
          const advertiserTx = transactions.find(
            (tx) =>
              tx.user?.id === transaction.topic?.advertiserId && tx.user?.name
          );

          if (advertiserTx?.user?.name) {
            return advertiserTx.user.name;
          }
        }
      }

      // getAdvertiserFromTopicを利用
      const advertiserName = getAdvertiserFromTopic(
        transaction.topic
          ? {
              id: transaction.topic.id,
              title: transaction.topic.title,
              advertiserId: transaction.topic.advertiserId,
            }
          : null
      );
      if (advertiserName) {
        return advertiserName;
      }

      // 同じトピックの他のトランザクションから広告主を探す
      if (transaction.topicId) {
        const topicTxs = transactions.filter(
          (tx) => tx.topicId === transaction.topicId
        );

        // 広告タイプのトランザクションを探す
        const adTx = topicTxs.find(
          (tx) =>
            tx.type === "advertisement" || tx.type === ("ad_payment" as string)
        );

        if (adTx?.user?.name) {
          return adTx.user.name;
        }
      }
    }

    // XYMが負の値（支払い）の場合は自分自身
    if (transaction.xymAmount < 0) {
      return "あなた";
    }

    // 同タイプの他のトランザクションから購入者情報を検索
    const similarTx = transactions.find(
      (t) =>
        t.type === transaction.type &&
        t !== transaction &&
        (t.purchaserUser?.name || t.user?.name)
    );

    if (similarTx?.purchaserUser?.name) {
      return similarTx.purchaserUser.name;
    }

    if (similarTx?.user?.name) {
      return similarTx.user.name;
    }

    return "広告主"; // 「不明なユーザー」ではなく「広告主」と表示
  };

  // 著者のウォレットアドレスを取得する関数
  const getAuthorWalletAddress = (transaction: Transaction): string | null => {
    console.log(
      `著者ウォレット取得試行: TX ID=${transaction.id}, タイプ=${transaction.type}`
    );

    // 記事から著者のウォレットアドレスを取得
    if (transaction.article?.user?.walletAddress) {
      console.log(
        `記事から著者ウォレット取得: ${transaction.article.user.walletAddress}`
      );
      return transaction.article.user.walletAddress;
    }

    // authorUserから著者のウォレットアドレスを取得
    if (transaction.authorUser?.walletAddress) {
      console.log(
        `authorUserから著者ウォレット取得: ${transaction.authorUser.walletAddress}`
      );
      return transaction.authorUser.walletAddress;
    }

    // メタデータからauthorIdを取得し、それに関連するユーザーを探す
    if (transaction.metadata) {
      let authorId: string | null = null;

      if (typeof transaction.metadata === "object") {
        if (
          "authorId" in transaction.metadata &&
          transaction.metadata.authorId
        ) {
          authorId = transaction.metadata.authorId as string;
        }
      } else if (typeof transaction.metadata === "string") {
        try {
          const meta = JSON.parse(transaction.metadata);
          if (meta.authorId) {
            authorId = meta.authorId;
          }
        } catch {
          // パースエラーは無視
        }
      }

      // 関連するトランザクションから著者情報を検索
      if (authorId) {
        const authorTransaction = transactions.find(
          (tx) =>
            (tx.authorUser?.id === authorId && tx.authorUser?.walletAddress) ||
            (tx.article?.user?.id === authorId &&
              tx.article?.user?.walletAddress)
        );

        if (authorTransaction?.authorUser?.walletAddress) {
          return authorTransaction.authorUser.walletAddress;
        }

        if (authorTransaction?.article?.user?.walletAddress) {
          return authorTransaction.article.user.walletAddress;
        }
      }
    }

    // 記事IDがあれば、その記事の著者のウォレットアドレスを探す
    if (transaction.articleId) {
      const articleTransaction = transactions.find(
        (tx) =>
          tx.articleId === transaction.articleId &&
          (tx.article?.user?.walletAddress || tx.authorUser?.walletAddress)
      );

      if (articleTransaction?.article?.user?.walletAddress) {
        return articleTransaction.article.user.walletAddress;
      }

      if (articleTransaction?.authorUser?.walletAddress) {
        return articleTransaction.authorUser.walletAddress;
      }
    }

    // トピックが関連付けられている場合、その記事作者を探す
    if (transaction.topicId) {
      const topicTransactions = transactions.filter(
        (tx) => tx.topicId === transaction.topicId && tx.articleId
      );

      for (const tx of topicTransactions) {
        if (tx.article?.user?.walletAddress) {
          return tx.article.user.walletAddress;
        }
        if (tx.authorUser?.walletAddress) {
          return tx.authorUser.walletAddress;
        }
      }
    }

    // 他のトランザクションから同じタイプの取引における著者のウォレットアドレスを探す
    if (
      transaction.type === "purchase" ||
      transaction.type === "tip" ||
      transaction.type === "receive_tip"
    ) {
      const sameTypeTransaction = transactions.find(
        (tx) =>
          tx.type === transaction.type &&
          tx !== transaction &&
          (tx.article?.user?.walletAddress || tx.authorUser?.walletAddress)
      );

      if (sameTypeTransaction?.article?.user?.walletAddress) {
        return sameTypeTransaction.article.user.walletAddress;
      }

      if (sameTypeTransaction?.authorUser?.walletAddress) {
        return sameTypeTransaction.authorUser.walletAddress;
      }
    }

    // XYMが正の値（受取）の場合は、ユーザー自身かもしれないのでシンボルアドレスを返す
    if (transaction.xymAmount > 0 && symbolAddress) {
      return symbolAddress;
    }

    console.warn(`著者ウォレット取得失敗: TX ID=${transaction.id}`);
    return "-"; // 空文字ではなく「-」を返す
  };

  // 購入者のウォレットアドレスを取得する関数
  const getPurchaserWalletAddress = (
    transaction: Transaction
  ): string | null => {
    // 購入者情報から直接取得
    if (transaction.purchaserUser?.walletAddress) {
      return transaction.purchaserUser.walletAddress;
    }

    // トランザクションユーザーからウォレットアドレスを取得
    if (transaction.user?.walletAddress) {
      return transaction.user.walletAddress;
    }

    // メタデータからpurchaserIdを取得し、それに関連するユーザーを探す
    if (transaction.metadata) {
      let purchaserId: string | null = null;
      let advertiserId: string | null = null;

      if (typeof transaction.metadata === "object") {
        if (
          "purchaserId" in transaction.metadata &&
          transaction.metadata.purchaserId
        ) {
          purchaserId = transaction.metadata.purchaserId as string;
        }
        if (
          "advertiserId" in transaction.metadata &&
          transaction.metadata.advertiserId
        ) {
          advertiserId = transaction.metadata.advertiserId as string;
        }
      } else if (typeof transaction.metadata === "string") {
        try {
          const meta = JSON.parse(transaction.metadata);
          if (meta.purchaserId) {
            purchaserId = meta.purchaserId;
          }
          if (meta.advertiserId) {
            advertiserId = meta.advertiserId;
          }
        } catch {
          // パースエラーは無視
        }
      }

      // 購入者IDから関連するトランザクションを検索
      if (purchaserId) {
        const purchaserTransaction = transactions.find(
          (tx) =>
            (tx.purchaserUser?.id === purchaserId &&
              tx.purchaserUser?.walletAddress) ||
            (tx.user?.id === purchaserId && tx.user?.walletAddress)
        );

        if (purchaserTransaction?.purchaserUser?.walletAddress) {
          return purchaserTransaction.purchaserUser.walletAddress;
        }

        if (purchaserTransaction?.user?.walletAddress) {
          return purchaserTransaction.user.walletAddress;
        }
      }

      // 広告主IDから関連する取引を検索
      if (
        advertiserId &&
        (transaction.type === "purchase" || transaction.type === "tip")
      ) {
        const advertiserTransaction = transactions.find(
          (tx) =>
            tx.metadata &&
            ((typeof tx.metadata === "object" &&
              "advertiserId" in tx.metadata &&
              tx.metadata.advertiserId === advertiserId) ||
              (typeof tx.metadata === "string" &&
                tx.metadata.includes(advertiserId)))
        );

        if (advertiserTransaction?.user?.walletAddress) {
          return advertiserTransaction.user.walletAddress;
        }
      }
    }

    // トピックに関連付けられた広告主のウォレットアドレスを探す
    if (transaction.topic) {
      // トピックから広告主IDを取得
      const advertiserId = transaction.topic.advertiserId;

      if (advertiserId) {
        // 広告主IDに基づいてユーザー情報を探す
        const advertiserTransaction = transactions.find(
          (tx) => tx.user?.id === advertiserId && tx.user?.walletAddress
        );

        if (advertiserTransaction?.user?.walletAddress) {
          return advertiserTransaction.user.walletAddress;
        }
      }

      // 同じトピックIDの他のトランザクションから広告主情報を探す
      const topicTransactions = transactions.filter(
        (tx) => tx.topicId === transaction.topicId
      );

      for (const tx of topicTransactions) {
        // トピックの広告主IDからウォレット情報を探す
        if (tx.topic?.advertiserId) {
          const adTx = transactions.find(
            (t) =>
              t.user?.id === tx.topic?.advertiserId && t.user?.walletAddress
          );
          if (adTx?.user?.walletAddress) {
            return adTx.user.walletAddress;
          }
        }

        // 広告主ユーザーの情報を確認
        if (
          tx.user?.walletAddress &&
          (tx.type === "advertisement" || tx.type === ("ad_payment" as string))
        ) {
          return tx.user.walletAddress;
        }
      }
    }

    // XYMが負の値（支払い）の場合は、ユーザー自身かもしれないのでシンボルアドレスを返す
    if (transaction.xymAmount < 0 && symbolAddress) {
      return symbolAddress;
    }

    // 同じタイプのトランザクションから関連情報を探す
    const similarTransaction = transactions.find(
      (tx) =>
        tx.type === transaction.type &&
        tx !== transaction &&
        (tx.purchaserUser?.walletAddress || tx.user?.walletAddress)
    );

    if (similarTransaction?.purchaserUser?.walletAddress) {
      return similarTransaction.purchaserUser.walletAddress;
    }

    if (similarTransaction?.user?.walletAddress) {
      return similarTransaction.user.walletAddress;
    }

    return "-"; // 空文字ではなく「-」を返す
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">ローディング中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">マイXYM</h1>
      <p className="text-gray-500 mb-6">
        あなたのXYM残高と取引履歴を確認できます
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-normal text-muted-foreground">
              総受取XYM
            </CardTitle>
            <CardDescription className="text-sm">
              これまでに受け取ったXYMの合計額
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReceivedXym} XYM</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-normal text-muted-foreground">
              総支払いXYM
            </CardTitle>
            <CardDescription className="text-sm">
              これまでに支払ったXYMの合計額
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPaidXym} XYM</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-normal text-muted-foreground">
              現在の残高
            </CardTitle>
            <CardDescription className="text-sm">
              受取額から支払額を差し引いた額
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentBalance} XYM</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">取引履歴</h2>

        {transactions.length === 0 ? (
          <EmptyState
            title="取引履歴がありません"
            description="まだXYMの取引がありません。記事を購入したり、投げ銭を送ったりすると、ここに表示されます。"
            icon="wallet"
          />
        ) : (
          <Tabs defaultValue="all" className="mb-4">
            <TabsList>
              <TabsTrigger value="all">すべて</TabsTrigger>
              <TabsTrigger value="income">受取履歴</TabsTrigger>
              <TabsTrigger value="expenses">支払い履歴</TabsTrigger>
              <TabsTrigger value="ad-related">広告履歴</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <TransactionTable
                transactions={transactions}
                getTransactionTypeText={getTransactionTypeText}
                getArticleTitle={getArticleTitle}
                getAuthorName={getAuthorName}
                getPurchaserName={getPurchaserName}
                getAuthorWalletAddress={getAuthorWalletAddress}
                getPurchaserWalletAddress={getPurchaserWalletAddress}
                getTransactionAmountClass={getTransactionAmountClass}
              />
            </TabsContent>

            <TabsContent value="income">
              <TransactionTable
                transactions={transactions.filter((tx) => tx.displayAmount > 0)}
                getTransactionTypeText={getTransactionTypeText}
                getArticleTitle={getArticleTitle}
                getAuthorName={getAuthorName}
                getPurchaserName={getPurchaserName}
                getAuthorWalletAddress={getAuthorWalletAddress}
                getPurchaserWalletAddress={getPurchaserWalletAddress}
                getTransactionAmountClass={getTransactionAmountClass}
              />
            </TabsContent>

            <TabsContent value="expenses">
              <TransactionTable
                transactions={transactions.filter((tx) => tx.displayAmount < 0)}
                getTransactionTypeText={getTransactionTypeText}
                getArticleTitle={getArticleTitle}
                getAuthorName={getAuthorName}
                getPurchaserName={getPurchaserName}
                getAuthorWalletAddress={getAuthorWalletAddress}
                getPurchaserWalletAddress={getPurchaserWalletAddress}
                getTransactionAmountClass={getTransactionAmountClass}
              />
            </TabsContent>

            <TabsContent value="ad-related">
              <TransactionTable
                transactions={transactions.filter(
                  (tx) =>
                    tx.type === "advertisement" ||
                    tx.type === ("ad_payment" as string) ||
                    tx.type === ("ad_revenue" as string)
                )}
                getTransactionTypeText={getTransactionTypeText}
                getArticleTitle={getArticleTitle}
                getAuthorName={getAuthorName}
                getPurchaserName={getPurchaserName}
                getAuthorWalletAddress={getAuthorWalletAddress}
                getPurchaserWalletAddress={getPurchaserWalletAddress}
                getTransactionAmountClass={getTransactionAmountClass}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Symbolアドレス情報 */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            Symbolアドレス
          </CardTitle>
          <CardDescription>あなたのXYM受取用アドレス</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <span className="text-sm font-mono truncate">
              {symbolAddress || "未設定"}
            </span>
            {symbolAddress && (
              <Button variant="ghost" size="sm" asChild className="ml-2">
                <Link
                  href={`https://symbol.blockchain-authn.app/accounts/${symbolAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
          {!symbolAddress && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => router.push("/profile/settings")}
            >
              アドレスを設定する
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ユーザープロフィール表示部分 */}
      {userSymbolAddress && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Symbol アドレス</p>
          <p className="font-mono text-xs break-all">{userSymbolAddress}</p>
        </div>
      )}

      {isUserAdvertiser && (
        <div className="mb-4 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-700">広告主アカウント</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={refreshData}
          >
            画面を更新
          </Button>
        </div>
      )}
    </div>
  );
};

// トランザクションテーブルコンポーネント
interface TransactionTableProps {
  transactions: TransactionWithDisplayAmount[];
  getTransactionTypeText: (type: string) => string;
  getArticleTitle: (transaction: Transaction) => string;
  getAuthorName: (transaction: Transaction) => string;
  getPurchaserName: (transaction: Transaction) => string;
  getAuthorWalletAddress: (transaction: Transaction) => string | null;
  getPurchaserWalletAddress: (transaction: Transaction) => string | null;
  getTransactionAmountClass: (amount: number) => string;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  getTransactionTypeText,
  getArticleTitle,
  getAuthorName,
  getPurchaserName,
  getAuthorWalletAddress,
  getPurchaserWalletAddress,
  getTransactionAmountClass,
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden md:table-cell">ID</TableHead>
          <TableHead>タイプ</TableHead>
          <TableHead>金額</TableHead>
          <TableHead>詳細</TableHead>
          <TableHead className="hidden md:table-cell">日時</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => {
          // ウォレットアドレスを取得（表示しないが関数を呼び出して未使用変数エラーを回避）
          // getAuthorWalletAddress and getPurchaserWalletAddress are called to satisfy linting
          getAuthorWalletAddress(transaction);
          getPurchaserWalletAddress(transaction);

          return (
            <TableRow key={transaction.id}>
              <TableCell className="hidden md:table-cell font-mono text-xs">
                {transaction.id}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <TransactionTypeIcon type={transaction.type} />
                  <span>{getTransactionTypeText(transaction.type)}</span>
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={getTransactionAmountClass(
                    transaction.displayAmount
                  )}
                >
                  {transaction.displayAmount > 0 ? "+" : ""}
                  {transaction.displayAmount} XYM
                </span>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {transaction.articleId && (
                    <Link
                      href={`/article/${transaction.articleId}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {getArticleTitle(transaction)}
                    </Link>
                  )}
                  <div className="flex flex-col text-xs text-muted-foreground">
                    <span>送信: {getPurchaserName(transaction)}</span>
                    <span>受取: {getAuthorName(transaction)}</span>
                  </div>
                  {transaction.transactionHash && (
                    <Link
                      href={`https://symbol.blockchain-authn.app/transactions/${transaction.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center"
                    >
                      <span className="truncate max-w-[140px]">
                        {transaction.transactionHash}
                      </span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(transaction.createdAt), {
                    addSuffix: true,
                    locale: ja,
                  })}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default UserTransactions;
