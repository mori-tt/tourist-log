"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, ArrowLeft, FileText, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Transaction {
  id: number;
  type: "purchase" | "tip" | "adFee" | string;
  xymAmount: number;
  createdAt: string;
  transactionHash: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
  };
  topicId: number;
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

export default function UserTransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user) {
      fetchTransactions();
    }
  }, [session, status, router]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/user/transactions");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error("取引履歴の取得に失敗しました:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">ログインが必要です</h1>
          <Button onClick={() => router.push("/login")}>ログインする</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/profile")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          プロフィール
        </Button>
        <h1 className="text-2xl font-bold">XYM取引履歴</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            あなたの取引履歴
            <Badge variant="outline" className="ml-2">
              個人用表示
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 border rounded-lg flex items-center justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium">
                    {tx.type === "tip"
                      ? "投げ銭"
                      : tx.type === "purchase"
                      ? "記事購入"
                      : tx.type === "adFee"
                      ? "広告料支払い"
                      : "その他"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleString("ja-JP")}
                  </p>
                  {tx.article && (
                    <Link
                      href={`/article/${tx.article.id}`}
                      className="flex items-center text-sm text-blue-600 hover:underline"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      {tx.article.title}
                    </Link>
                  )}
                  {tx.topic && (
                    <Link
                      href={`/topics/${tx.topic.id}`}
                      className="flex items-center text-sm text-green-600 hover:underline"
                    >
                      <Tag className="h-4 w-4 mr-1" />
                      {tx.topic.title}
                    </Link>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">
                    {tx.xymAmount} XYM
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {tx.transactionHash}
                  </p>
                </div>
              </div>
            ))}

            {/* 合計金額 */}
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="font-medium">合計XYM</p>
                <p className="font-bold text-green-600">
                  {transactions.reduce((sum, tx) => sum + tx.xymAmount, 0)} XYM
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
