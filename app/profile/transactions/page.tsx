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
        setIsUserAdvertiser(userData.isAdvertiser || false);
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
            icon={<Wallet className="h-12 w-12 text-gray-400" />}
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
                getTransactionAmountClass={getTransactionAmountClass}
              />
            </TabsContent>

            <TabsContent value="ad-related">
              <TransactionTable
                transactions={transactions.filter(
                  (tx) =>
                    tx.type === "advertisement" ||
                    tx.type === "ad_payment" ||
                    tx.type === "ad_revenue"
                )}
                getTransactionTypeText={getTransactionTypeText}
                getArticleTitle={getArticleTitle}
                getAuthorName={getAuthorName}
                getPurchaserName={getPurchaserName}
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
            {symbolAddress ? (
              <>
                <span className="text-sm font-mono truncate">
                  {symbolAddress}
                </span>
                <Button variant="ghost" size="sm" asChild className="ml-2">
                  <Link
                    href={`https://symbol.blockchain-authn.app/accounts/${symbolAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">未設定</span>
            )}
          </div>
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/profile/settings")}
            >
              {symbolAddress ? "アドレスを変更する" : "アドレスを設定する"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 広告主情報 */}
      {isUserAdvertiser && (
        <div className="mb-4 p-3 mt-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm font-medium text-yellow-800">
            広告主アカウント
          </p>
          <p className="text-xs text-yellow-700 mt-1 mb-2">
            あなたは広告主として登録されています
          </p>
          <Button variant="outline" size="sm" onClick={refreshData}>
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
        {transactions.map((transaction) => (
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
                className={getTransactionAmountClass(transaction.displayAmount)}
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
        ))}
      </TableBody>
    </Table>
  );
};

export default UserTransactions;
