"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  ArrowLeft,
  FileText,
  Tag,
  User,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

interface Transaction {
  id: number;
  type: "purchase" | "tip" | "adFee" | "advertisement" | "receive_tip" | string;
  xymAmount: number;
  createdAt: string;
  transactionHash: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
  };
  topicId: number;
  articleId?: number;
  article?: {
    id: number;
    title: string;
    user: {
      id: string;
      name: string;
    };
  };
  topic?: {
    id: number;
    title: string;
    advertiser: {
      id: string;
      name: string;
    };
  };
}

export default function AdminTransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user?.isAdmin) {
      fetchTransactions();
    } else if (status !== "loading") {
      router.push("/");
    }
  }, [session, status, router]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/transactions");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
      } else {
        throw new Error("Failed to fetch transactions");
      }
    } catch (error) {
      console.error("取引履歴の取得に失敗しました:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    // タイプフィルター
    if (filterType !== "all" && tx.type !== filterType) {
      return false;
    }

    // 検索クエリ
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const articleTitle = tx.article?.title?.toLowerCase() || "";
      const topicTitle = tx.topic?.title?.toLowerCase() || "";
      const userName = tx.user?.name?.toLowerCase() || "";
      const txHash = tx.transactionHash.toLowerCase();

      return (
        articleTitle.includes(query) ||
        topicTitle.includes(query) ||
        userName.includes(query) ||
        txHash.includes(query) ||
        tx.id.toString().includes(query)
      );
    }

    return true;
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">管理者専用ページです</h1>
          <Button onClick={() => router.push("/")}>ホームに戻る</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          管理者メニュー
        </Button>
        <h1 className="text-2xl font-bold">全トランザクション履歴</h1>
      </div>

      {/* フィルターと検索 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Input
              type="text"
              placeholder="検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <span>
                  {filterType === "all" ? "全てのタイプ" : filterType}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全てのタイプ</SelectItem>
              <SelectItem value="purchase">記事購入</SelectItem>
              <SelectItem value="tip">投げ銭</SelectItem>
              <SelectItem value="adFee">広告料支払い</SelectItem>
              <SelectItem value="advertisement">広告掲載</SelectItem>
              <SelectItem value="receive_tip">投げ銭受取</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            トランザクション履歴
            <Badge variant="outline" className="ml-2">
              管理者用表示
            </Badge>
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            合計: {filteredTransactions.length} 件
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  トランザクション履歴がありません
                </p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div key={tx.id} className="p-4 border rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                    <div className="flex items-center mb-2 sm:mb-0">
                      <Badge
                        className={`mr-2 ${
                          tx.type === "purchase"
                            ? "bg-blue-100 text-blue-800"
                            : tx.type === "tip"
                            ? "bg-green-100 text-green-800"
                            : tx.type === "adFee"
                            ? "bg-purple-100 text-purple-800"
                            : tx.type === "advertisement"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {tx.type === "purchase"
                          ? "記事購入"
                          : tx.type === "tip"
                          ? "投げ銭"
                          : tx.type === "adFee"
                          ? "広告料支払い"
                          : tx.type === "advertisement"
                          ? "広告掲載"
                          : tx.type === "receive_tip"
                          ? "投げ銭受取"
                          : tx.type}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString("ja-JP")}
                      </p>
                    </div>
                    <div className="font-medium text-green-600">
                      {tx.xymAmount} XYM
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    {tx.article && (
                      <Link
                        href={`/article/${tx.article.id}`}
                        className="flex items-center text-sm text-blue-600 hover:underline"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        <span className="font-medium">記事:</span>{" "}
                        {tx.article.title}
                      </Link>
                    )}
                    {tx.topic && (
                      <Link
                        href={`/topics/${tx.topic.id}`}
                        className="flex items-center text-sm text-green-600 hover:underline"
                      >
                        <Tag className="h-4 w-4 mr-1" />
                        <span className="font-medium">トピック:</span>{" "}
                        {tx.topic.title}
                      </Link>
                    )}
                    {tx.user && (
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 mr-1" />
                        <span className="font-medium">ユーザー:</span>{" "}
                        {tx.user.name}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground truncate">
                      <span className="font-medium">
                        トランザクションハッシュ:
                      </span>{" "}
                      {tx.transactionHash}
                    </div>
                  </div>

                  <div className="flex items-center text-xs text-muted-foreground">
                    <span className="font-medium mr-1">Transaction ID:</span>{" "}
                    {tx.id}
                    {tx.articleId && (
                      <>
                        <span className="mx-2">|</span>
                        <span className="font-medium mr-1">
                          Article ID:
                        </span>{" "}
                        {tx.articleId}
                      </>
                    )}
                    <span className="mx-2">|</span>
                    <span className="font-medium mr-1">Topic ID:</span>{" "}
                    {tx.topicId}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
