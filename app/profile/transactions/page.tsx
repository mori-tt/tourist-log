"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ExternalLink, Wallet } from "lucide-react";
import Link from "next/link";
import { Transaction } from "@/types";
import TransactionTypeIcon from "@/components/TransactionTypeIcon";
import EmptyState from "@/components/EmptyState";

// メタデータから値を安全に取得するユーティリティ関数
const getMetadataValue = (
  metadata: string | Record<string, unknown> | null,
  key: string
): string | null => {
  if (!metadata) return null;

  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata);
      return typeof parsed[key] === "string" ? parsed[key] : null;
    } catch {
      // パースエラーの場合は null
      return null;
    }
  } else if (typeof metadata === "object") {
    return typeof metadata[key] === "string" ? (metadata[key] as string) : null;
  }

  return null;
};

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

  // セッションが無効な場合はログインページにリダイレクト
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    // 管理者の場合はダッシュボードにリダイレクト
    if (session?.user?.isAdmin) {
      router.push("/dashboard");
      return;
    }
  }, [status, router, session]);

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

        // ユーザーのウォレットアドレスをセット
        if (userData.walletAddress) {
          setSymbolAddress(userData.walletAddress);
        }

        // ユーザーが広告主かどうかをセット
        if (userData.isAdvertiser) {
          setIsUserAdvertiser(userData.isAdvertiser);
        }
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

        // APIレスポンスから広告主フラグを取得
        const apiAdvertiserFlag = data.isAdvertiser || false;

        // 状態を更新
        if (apiAdvertiserFlag) {
          setIsUserAdvertiser(apiAdvertiserFlag);
        }

        // isUserAdvertiser状態変数を使用してトランザクションを処理（直接APIレスポンスのフラグは使わない）
        const processedTx = processTransactionsWithFlag(
          data.transactions,
          session.user.id,
          isUserAdvertiser
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
  }, [status, session, isUserAdvertiser]);

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

    return { received, paid };
  };

  // 広告主フラグを直接渡して使用するトランザクション処理関数
  const processTransactionsWithFlag = (
    transactions: Transaction[],
    userId: string,
    isAdvertiser: boolean
  ): TransactionWithDisplayAmount[] => {
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

      // 1. 著者として受け取る場合は常にプラス表示（最優先）
      if (isAuthorReceiving) {
        displayAmount = Math.abs(transaction.xymAmount);
      }
      // 2. 広告主の場合、支払いタイプのトランザクションは全てマイナス表示（著者受取を除く）
      else if (isAdvertiser && isPaymentType) {
        displayAmount = -Math.abs(transaction.xymAmount);
      }
      // 3. 通常ユーザーで支払いタイプかつユーザーIDが一致する場合はマイナス表示
      else if (
        !isAdvertiser &&
        isPaymentType &&
        transaction.userId === userId
      ) {
        displayAmount = -Math.abs(transaction.xymAmount);
      }
      // 4. 受取タイプの取引はプラス表示
      else if (isReceiptType) {
        displayAmount = Math.abs(transaction.xymAmount);
      }

      // 最終チェック: 広告主かつ支払いタイプなのに金額がプラスになっている場合は修正
      if (
        isAdvertiser &&
        isPaymentType &&
        !isAuthorReceiving &&
        displayAmount > 0
      ) {
        displayAmount = -Math.abs(displayAmount);
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
    const articleTitle = getMetadataValue(transaction.metadata, "articleTitle");
    if (articleTitle) {
      return articleTitle;
    }

    return "不明な記事";
  };

  // 種類から説明テキストを取得
  const getTransactionTypeText = (type: string) => {
    const typeTextMap: Record<string, string> = {
      purchase: "記事購入",
      tip: "投げ銭",
      receive_tip: "投げ銭受取",
      ad_payment: "広告費支払い",
      ad_revenue: "広告収入",
      advertisement: "広告掲載",
    };

    return typeTextMap[type] || type;
  };

  // 著者名を取得
  const getAuthorName = (transaction: Transaction) => {
    // 記事オブジェクトの中に著者情報がある場合（最優先）
    if (transaction.article?.user?.name) {
      return transaction.article.user.name;
    }

    // 著者情報がauthorUserにある場合
    if (transaction.authorUser?.name) {
      return transaction.authorUser.name;
    }

    // メタデータから著者名を取得
    const authorName = getMetadataValue(transaction.metadata, "authorName");
    if (authorName) {
      return authorName;
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

    // セッションユーザーの情報を使用（特に受取トランザクションの場合）
    if (transaction.xymAmount > 0) {
      return "あなた";
    }

    return "記事作者";
  };

  // 購入者名を取得
  const getPurchaserName = (transaction: Transaction) => {
    // ユーザー自身の場合は「あなた」と表示
    if (transaction.userId === session?.user?.id) {
      return "あなた";
    }

    // 購入者情報が直接存在する場合
    if (transaction.purchaserUser?.name) {
      return transaction.purchaserUser.name;
    }

    // トランザクションのユーザー情報を使用
    if (transaction.user?.name) {
      return transaction.user.name;
    }

    // メタデータから購入者名または広告主名を取得
    if (transaction.metadata) {
      try {
        const metaData =
          typeof transaction.metadata === "string"
            ? JSON.parse(transaction.metadata)
            : transaction.metadata;

        if (metaData.purchaserName) {
          return metaData.purchaserName;
        }

        // 記事購入や投げ銭の場合、広告主名を使用
        if (
          (transaction.type === "purchase" || transaction.type === "tip") &&
          metaData.advertiserName
        ) {
          return metaData.advertiserName;
        }
      } catch {
        // パースエラーは無視
      }
    }

    // トピックから広告主情報を取得（記事購入や投げ銭の場合）
    if (
      (transaction.type === "purchase" || transaction.type === "tip") &&
      transaction.topic?.advertiserId
    ) {
      // 同じトピックの他のトランザクションから広告主を検索
      const advertiserTx = transactions.find(
        (tx) => tx.user?.id === transaction.topic?.advertiserId && tx.user?.name
      );

      if (advertiserTx?.user?.name) {
        return advertiserTx.user.name;
      }
    }

    // XYMが負の値（支払い）の場合は自分自身
    if (transaction.xymAmount < 0) {
      return "あなた";
    }

    return "広告主";
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">ローディング中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">取引履歴</h1>
      <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
        Symbolブロックチェーン上のXYM取引履歴を確認できます
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card className="bg-green-50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm sm:text-base font-medium text-green-700">
                受け取り合計
              </h2>
              <p className="text-base sm:text-lg font-bold text-green-800">
                {totalReceivedXym} XYM
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm sm:text-base font-medium text-red-700">
                支払い合計
              </h2>
              <p className="text-base sm:text-lg font-bold text-red-800">
                {totalPaidXym} XYM
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm sm:text-base font-medium text-blue-700">
                収支残高
              </h2>
              <p className="text-base sm:text-lg font-bold text-blue-800">
                {currentBalance} XYM
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {symbolAddress && (
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Symbol ウォレット情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm gap-2">
              <span className="font-medium">アドレス:</span>
              <div className="w-full overflow-hidden">
                <code className="bg-gray-100 p-1 sm:p-2 rounded flex-1 block font-mono text-xs truncate">
                  {symbolAddress}
                </code>
              </div>
              <Link
                href={`https://symbol.blockchain-authn.app/accounts/${symbolAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 inline-flex items-center whitespace-nowrap"
              >
                <span className="mr-1">確認</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="mb-4 sm:mb-6">
        <TabsList className="grid w-full grid-cols-3 mb-2 sm:mb-4 h-auto p-1">
          <TabsTrigger
            value="all"
            className="text-xs sm:text-sm py-1 sm:py-2 h-auto data-[state=active]:font-medium"
          >
            全ての取引
          </TabsTrigger>
          <TabsTrigger
            value="income"
            className="text-xs sm:text-sm py-1 sm:py-2 h-auto data-[state=active]:font-medium"
          >
            受け取り
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="text-xs sm:text-sm py-1 sm:py-2 h-auto data-[state=active]:font-medium"
          >
            支払い
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {transactions.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <TransactionTable
                  transactions={transactions}
                  getTransactionTypeText={getTransactionTypeText}
                  getArticleTitle={getArticleTitle}
                  getAuthorName={getAuthorName}
                  getPurchaserName={getPurchaserName}
                  getTransactionAmountClass={getTransactionAmountClass}
                />
              </div>
            </div>
          ) : (
            <EmptyState
              title="取引履歴がありません"
              description="XYM取引が発生するとここに表示されます"
              icon={<Wallet className="h-12 w-12 text-gray-300" />}
            />
          )}
        </TabsContent>

        <TabsContent value="income" className="mt-0">
          {transactions.filter((tx) => tx.displayAmount > 0).length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <TransactionTable
                  transactions={transactions.filter(
                    (tx) => tx.displayAmount > 0
                  )}
                  getTransactionTypeText={getTransactionTypeText}
                  getArticleTitle={getArticleTitle}
                  getAuthorName={getAuthorName}
                  getPurchaserName={getPurchaserName}
                  getTransactionAmountClass={getTransactionAmountClass}
                />
              </div>
            </div>
          ) : (
            <EmptyState
              title="受け取り履歴がありません"
              description="XYMを受け取ると、ここに表示されます"
              icon={<Wallet className="h-12 w-12 text-gray-300" />}
            />
          )}
        </TabsContent>

        <TabsContent value="expenses" className="mt-0">
          {transactions.filter((tx) => tx.displayAmount < 0).length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <TransactionTable
                  transactions={transactions.filter(
                    (tx) => tx.displayAmount < 0
                  )}
                  getTransactionTypeText={getTransactionTypeText}
                  getArticleTitle={getArticleTitle}
                  getAuthorName={getAuthorName}
                  getPurchaserName={getPurchaserName}
                  getTransactionAmountClass={getTransactionAmountClass}
                />
              </div>
            </div>
          ) : (
            <EmptyState
              title="支払い履歴がありません"
              description="XYMを支払うと、ここに表示されます"
              icon={<Wallet className="h-12 w-12 text-gray-300" />}
            />
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="text-xs sm:text-sm h-8 sm:h-9"
          onClick={() => router.push("/profile")}
        >
          プロフィールに戻る
        </Button>
      </div>

      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={refreshData} size="sm">
          更新
        </Button>
      </div>
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
  getTransactionAmountClass: (amount: number) => string;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  getTransactionTypeText,
  getArticleTitle,
  getAuthorName,
  getPurchaserName,
  getTransactionAmountClass,
}) => {
  return (
    <Table className="min-w-full">
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="whitespace-nowrap text-xs w-24 sm:w-auto">
            取引タイプ
          </TableHead>
          <TableHead className="whitespace-nowrap text-xs hidden sm:table-cell">
            詳細
          </TableHead>
          <TableHead className="whitespace-nowrap text-xs">日時</TableHead>
          <TableHead className="whitespace-nowrap text-xs text-right">
            金額
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id} className="hover:bg-muted/30">
            <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-3">
              <div className="flex items-center">
                <TransactionTypeIcon
                  type={transaction.type}
                  className="mr-1 sm:mr-2 h-4 w-4 flex-shrink-0"
                />
                <span className="truncate">
                  {getTransactionTypeText(transaction.type)}
                </span>
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell text-xs">
              {transaction.articleId ? (
                <div className="space-y-1">
                  <div>
                    <span className="font-medium">記事:</span>{" "}
                    {getArticleTitle(transaction)}
                  </div>
                  <div>
                    <span className="font-medium">著者:</span>{" "}
                    {getAuthorName(transaction)}
                  </div>
                  {transaction.type === "purchase" && (
                    <div>
                      <span className="font-medium">購入者:</span>{" "}
                      {getPurchaserName(transaction)}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell className="text-xs whitespace-nowrap">
              {formatDistanceToNow(new Date(transaction.createdAt), {
                addSuffix: true,
                locale: ja,
              })}
            </TableCell>
            <TableCell
              className={`text-right font-medium text-xs sm:text-sm ${getTransactionAmountClass(
                transaction.displayAmount
              )}`}
            >
              {transaction.displayAmount > 0 ? "+" : ""}
              {transaction.displayAmount} XYM
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UserTransactions;
