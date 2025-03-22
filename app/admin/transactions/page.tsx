"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Transaction } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import TransactionTypeIcon from "@/components/TransactionTypeIcon";
import EmptyState from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Add interface for Transaction with display amount
interface TransactionWithDisplayAmount extends Transaction {
  displayAmount: number;
}

const AdminTransactions = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<
    TransactionWithDisplayAmount[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalXymVolume, setTotalXymVolume] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(50);

  // セッションが無効または管理者でない場合はリダイレクト
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && session?.user?.isAdmin !== true) {
      router.push("/");
    }
  }, [status, session, router]);

  // トランザクション履歴を取得
  useEffect(() => {
    const fetchTransactions = async () => {
      if (status !== "authenticated" || session?.user?.isAdmin !== true) return;

      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: limit.toString(),
        });

        const response = await fetch(`/api/admin/transactions?${queryParams}`);
        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }

        const data = await response.json();

        // 取得したトランザクションデータを処理
        const processedTransactions = data.transactions.map(
          (tx: Transaction) => {
            // 表示用の金額を計算
            const displayAmount = tx.xymAmount;

            // 必要に応じて表示金額を調整するロジック
            // 例: 特定のトランザクションタイプに応じた調整など
            // if (tx.type === "purchase" || tx.type === "tip") {
            //   // 購入や投げ銭のロジック
            // } else if (tx.type === "ad_payment" || tx.type === "advertisement") {
            //   // 広告関連のロジック
            // }

            return {
              ...tx,
              displayAmount,
            };
          }
        );

        setTransactions(processedTransactions);
        setTotalTransactions(data.totalCount);

        // 総取引量の計算
        const volume = processedTransactions.reduce(
          (sum: number, tx: TransactionWithDisplayAmount) => {
            return sum + Math.abs(tx.xymAmount);
          },
          0
        );
        setTotalXymVolume(volume);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setLoading(false);
      }
    };

    if (status === "authenticated" && session?.user?.isAdmin === true) {
      fetchTransactions();
    }
  }, [status, session, currentPage, limit]);

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

  // ユーザー名を取得（送信者または受取者）
  const getUserName = (
    transaction: Transaction,
    isReceiver: boolean = false
  ) => {
    if (isReceiver) {
      // 受取者の名前を取得
      if (transaction.authorUser?.name) {
        return transaction.authorUser.name;
      }
      // 記事の著者名
      if (transaction.article?.user?.name) {
        return transaction.article.user.name;
      }
    } else {
      // 送信者の名前を取得
      if (transaction.user?.name) {
        return transaction.user.name;
      }
      // 広告主の場合
      if (transaction.advertiserUser?.name) {
        return transaction.advertiserUser.name;
      }
    }

    // メタデータから取得
    if (transaction.metadata && typeof transaction.metadata === "object") {
      if (isReceiver && "authorName" in transaction.metadata) {
        return transaction.metadata.authorName as string;
      }
      if (!isReceiver && "purchaserName" in transaction.metadata) {
        return transaction.metadata.purchaserName as string;
      }
    } else if (typeof transaction.metadata === "string") {
      try {
        const meta = JSON.parse(transaction.metadata);
        if (isReceiver && meta.authorName) {
          return meta.authorName;
        }
        if (!isReceiver && meta.purchaserName) {
          return meta.purchaserName;
        }
      } catch {
        // パースエラーは無視
      }
    }

    return isReceiver ? "受取ユーザー" : "支払いユーザー";
  };

  // 記事のタイトルを取得
  const getArticleTitle = (transaction: Transaction) => {
    // 記事オブジェクトがある場合はそこからタイトルを取得
    if (transaction.article?.title) {
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

  // トランザクションの詳細情報を表示する関数
  const renderTransactionDetails = (transaction: Transaction) => {
    const type = transaction.type as string;
    const senderName = getUserName(transaction, false);
    const receiverName = getUserName(transaction, true);

    // 記事購入の場合
    if (type === "purchase") {
      return (
        <>
          <span>支払: {senderName}</span>
          <span>受取: {receiverName}</span>
        </>
      );
    }

    // 投げ銭の場合
    if (type === "tip" || type === "receive_tip") {
      return (
        <>
          <span>送信: {senderName}</span>
          <span>受取: {receiverName}</span>
        </>
      );
    }

    // 広告関連の場合
    if (
      type === "ad_payment" ||
      type === "advertisement" ||
      type === "ad_revenue"
    ) {
      return (
        <>
          <span>広告主: {senderName}</span>
          {type === "ad_revenue" && <span>受取: {receiverName}</span>}
        </>
      );
    }

    // その他/デフォルト
    return (
      <>
        <span>送信: {senderName}</span>
        <span>受取: {receiverName}</span>
      </>
    );
  };

  // 取引金額の表示クラスを決定
  const getTransactionAmountClass = (
    transaction: TransactionWithDisplayAmount
  ) => {
    return transaction.displayAmount > 0
      ? "text-green-600 dark:text-green-500 font-semibold"
      : "text-red-600 dark:text-red-500 font-semibold";
  };

  // ページネーション処理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
      <h1 className="text-2xl font-bold mb-6">管理者画面: 取引履歴</h1>
      <p className="text-gray-500 mb-6">
        システム全体のXYM取引履歴を確認できます
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-normal text-muted-foreground">
              総取引件数
            </CardTitle>
            <CardDescription className="text-sm">
              システム全体の取引件数
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions} 件</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-normal text-muted-foreground">
              総取引量
            </CardTitle>
            <CardDescription className="text-sm">
              これまでの取引総額
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalXymVolume} XYM</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-normal text-muted-foreground">
              平均取引額
            </CardTitle>
            <CardDescription className="text-sm">
              1取引あたりの平均金額
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalTransactions
                ? (totalXymVolume / totalTransactions).toFixed(2)
                : 0}{" "}
              XYM
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">取引履歴</h2>

        {transactions.length === 0 ? (
          <EmptyState
            title="取引履歴がありません"
            description="システムにXYM取引のレコードがありません。"
            icon="wallet"
          />
        ) : (
          <Tabs defaultValue="all" className="mb-4">
            <TabsList>
              <TabsTrigger value="all">すべて</TabsTrigger>
              <TabsTrigger value="purchases">記事購入</TabsTrigger>
              <TabsTrigger value="tips">投げ銭</TabsTrigger>
              <TabsTrigger value="advertisements">広告関連</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <TransactionTable
                transactions={transactions}
                getTransactionTypeText={getTransactionTypeText}
                getArticleTitle={getArticleTitle}
                renderTransactionDetails={renderTransactionDetails}
                getTransactionAmountClass={getTransactionAmountClass}
              />
            </TabsContent>

            <TabsContent value="purchases">
              <TransactionTable
                transactions={transactions.filter(
                  (tx) => tx.type === "purchase"
                )}
                getTransactionTypeText={getTransactionTypeText}
                getArticleTitle={getArticleTitle}
                renderTransactionDetails={renderTransactionDetails}
                getTransactionAmountClass={getTransactionAmountClass}
              />
            </TabsContent>

            <TabsContent value="tips">
              <TransactionTable
                transactions={transactions.filter(
                  (tx) => tx.type === "tip" || tx.type === "receive_tip"
                )}
                getTransactionTypeText={getTransactionTypeText}
                getArticleTitle={getArticleTitle}
                renderTransactionDetails={renderTransactionDetails}
                getTransactionAmountClass={getTransactionAmountClass}
              />
            </TabsContent>

            <TabsContent value="advertisements">
              <TransactionTable
                transactions={transactions.filter(
                  (tx) =>
                    tx.type === "advertisement" ||
                    tx.type === "ad_payment" ||
                    tx.type === "ad_revenue"
                )}
                getTransactionTypeText={getTransactionTypeText}
                getArticleTitle={getArticleTitle}
                renderTransactionDetails={renderTransactionDetails}
                getTransactionAmountClass={getTransactionAmountClass}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* ページネーション表示 */}
      <div className="flex justify-between items-center mb-4">
        <div>
          全 {totalTransactions} 件中 {(currentPage - 1) * limit + 1} -{" "}
          {Math.min(currentPage * limit, totalTransactions)} 件を表示
        </div>
        <div className="flex space-x-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            前へ
          </button>
          <span className="px-3 py-1">ページ {currentPage}</span>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={currentPage * limit >= totalTransactions}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
};

// トランザクションテーブルコンポーネント
interface TransactionTableProps {
  transactions: TransactionWithDisplayAmount[];
  getTransactionTypeText: (type: string) => string;
  getArticleTitle: (transaction: Transaction) => string;
  renderTransactionDetails: (transaction: Transaction) => React.ReactNode;
  getTransactionAmountClass: (
    transaction: TransactionWithDisplayAmount
  ) => string;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  getTransactionTypeText,
  getArticleTitle,
  renderTransactionDetails,
  getTransactionAmountClass,
}) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        該当する取引がありません
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>取引タイプ</TableHead>
            <TableHead>金額</TableHead>
            <TableHead>詳細</TableHead>
            <TableHead>トピックID</TableHead>
            <TableHead>日時</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            return (
              <TableRow key={transaction.id}>
                <TableCell className="font-mono text-xs">
                  {transaction.id}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <TransactionTypeIcon type={transaction.type} />
                    <span>{getTransactionTypeText(transaction.type)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={getTransactionAmountClass(transaction)}>
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
                      {renderTransactionDetails(transaction)}
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
                <TableCell>{transaction.topicId}</TableCell>
                <TableCell>
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
    </div>
  );
};

export default AdminTransactions;
