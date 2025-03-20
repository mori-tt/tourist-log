"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import WalletAddressAlert from "@/components/WalletAddressAlert";
import {
  DollarSign,
  ArrowLeft,
  TrendingUp,
  Info,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  CreditCard,
  FileText,
  Layers,
} from "lucide-react";
import Link from "next/link";

interface PageViewData {
  id: number;
  topicId: number;
  year: number;
  month: number;
  pageViews: number;
  isConfirmed: boolean;
  isPaid: boolean;
  confirmedAt: string;
  paidAt: string | null;
  topic: {
    title: string;
    adFee: number;
    monthlyPVThreshold: number;
    advertiser: {
      name: string;
      email: string;
    };
  };
}

// 記事データの型定義
interface ArticleData {
  id: number;
  title: string;
  topicId: number;
  views: number;
  userId: string;
  author: string;
}

export default function PaymentsPage() {
  const { data: session, status } = useSession();
  const [pageViews, setPageViews] = useState<PageViewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [walletError, setWalletError] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [currentPageView, setCurrentPageView] = useState<PageViewData | null>(
    null
  );
  const [privateKey, setPrivateKey] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // PV閾値達成状況用のステート
  const [topicsSummary, setTopicsSummary] = useState<{
    [topicId: number]: {
      title: string;
      adFee: number;
      threshold: number;
      currentPVs: number;
      articleCount: number;
      articles: ArticleData[];
    };
  }>({});

  // fetchData関数を useCallback でラップ
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // ウォレットアドレスの確認
      const walletRes = await fetch("/api/user/wallet");
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        if (!walletData.walletAddress) {
          setWalletError(true);
        }
      }

      // PVデータの取得
      const res = await fetch("/api/pageviews");
      if (!res.ok) {
        throw new Error("PVデータの取得に失敗しました");
      }
      const data = await res.json();
      setPageViews(data);

      // トピックごとの記事とPV数の取得
      const articlesRes = await fetch("/api/advertiser/articles");
      if (articlesRes.ok) {
        const articlesData = await articlesRes.json();

        // トピックごとのサマリーを作成
        processTopicsSummary(articlesData, data);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("データの取得中にエラーが発生しました");
      }
    } finally {
      setLoading(false);
    }
  }, []); // 空の依存配列でラップ

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      signIn();
      return;
    }

    // ユーザーが広告主でない場合はリダイレクト
    if (!session.user.isAdvertiser) {
      window.location.href = "/";
      return;
    }

    fetchData();
  }, [session, status, fetchData]);

  // トピックごとのPV達成状況サマリーを作成
  const processTopicsSummary = (
    articlesData: ArticleData[],
    pvData: PageViewData[]
  ) => {
    const summary: {
      [topicId: number]: {
        title: string;
        adFee: number;
        threshold: number;
        currentPVs: number;
        articleCount: number;
        articles: ArticleData[];
      };
    } = {};

    // 記事データからトピックごとにグループ化
    articlesData.forEach((article) => {
      if (!summary[article.topicId]) {
        // PVデータからトピック情報を取得
        const topicPvData = pvData.find((pv) => pv.topicId === article.topicId);

        summary[article.topicId] = {
          title: topicPvData?.topic.title || "不明なトピック",
          adFee: topicPvData?.topic.adFee || 0,
          threshold: topicPvData?.topic.monthlyPVThreshold || 0,
          currentPVs: article.views || 0,
          articleCount: 1,
          articles: [article],
        };
      } else {
        summary[article.topicId].currentPVs += article.views || 0;
        summary[article.topicId].articleCount += 1;
        summary[article.topicId].articles.push(article);
      }
    });

    setTopicsSummary(summary);
  };

  const handlePayment = async () => {
    if (!currentPageView) return;

    setPaymentProcessing(true);
    setPaymentError("");
    try {
      const response = await fetch(`/api/pageviews/${currentPageView.id}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          privateKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "支払い処理中にエラーが発生しました"
        );
      }

      await response.json();
      setPaymentSuccess(true);

      // 支払い完了後にデータを再取得
      await fetchData();

      // 3秒後にダイアログを閉じる
      setTimeout(() => {
        setPaymentDialogOpen(false);
        setPaymentSuccess(false);
        setPrivateKey("");
      }, 3000);
    } catch (error) {
      if (error instanceof Error) {
        setPaymentError(error.message);
      } else {
        setPaymentError("支払い処理中にエラーが発生しました");
      }
    } finally {
      setPaymentProcessing(false);
    }
  };

  const openPaymentDialog = (pageView: PageViewData) => {
    setCurrentPageView(pageView);
    setPaymentDialogOpen(true);
    setPaymentSuccess(false);
    setPaymentError("");
    setPrivateKey("");
  };

  const canPay = (pageView: PageViewData) => {
    return (
      pageView.isConfirmed &&
      !pageView.isPaid &&
      pageView.pageViews >= pageView.topic.monthlyPVThreshold
    );
  };

  // PV閾値達成率を計算
  const calculatePvPercentage = (currentPVs: number, threshold: number) => {
    if (threshold <= 0) return 0;
    return Math.min(Math.round((currentPVs / threshold) * 100), 100);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center mb-6">
        <Link
          href="/"
          className="mr-4 flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>ホームに戻る</span>
        </Link>
        <h1 className="text-3xl font-bold">広告料支払い管理</h1>
      </div>

      {walletError && <WalletAddressAlert className="mb-6" />}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Tabs defaultValue="pv-status">
          <TabsList className="mb-4">
            <TabsTrigger value="pv-status">
              <TrendingUp className="h-4 w-4 mr-2" />
              PV達成状況
            </TabsTrigger>
            <TabsTrigger value="payment-history">
              <DollarSign className="h-4 w-4 mr-2" />
              支払い履歴
            </TabsTrigger>
          </TabsList>

          {/* PV達成状況タブ */}
          <TabsContent value="pv-status">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                  トピックごとのPV達成状況
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6">
                  <Info className="h-4 w-4" />
                  <AlertTitle>広告料支払いの仕組み</AlertTitle>
                  <AlertDescription>
                    各トピックには月間PV閾値が設定されています。トピックに紐づく記事の合計PVが閾値を超えると、設定された広告料が記事投稿者に支払われます。
                  </AlertDescription>
                </Alert>

                {Object.entries(topicsSummary).length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg">
                    <FileText className="h-16 w-16 text-muted mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">
                      データがありません
                    </p>
                    <p className="text-muted-foreground">
                      まだトピックの作成や記事の投稿がありません。
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(topicsSummary).map(([topicId, data]) => {
                      const pvPercentage = calculatePvPercentage(
                        data.currentPVs,
                        data.threshold
                      );
                      const thresholdReached =
                        data.currentPVs >= data.threshold;

                      return (
                        <div key={topicId} className="rounded-lg border p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-medium">
                                {data.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                記事数: {data.articleCount}件
                              </p>
                            </div>
                            <Badge
                              className={
                                thresholdReached
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                              }
                            >
                              {thresholdReached ? "達成" : "未達成"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <p className="text-sm text-blue-700 mb-1">
                                現在のPV
                              </p>
                              <p className="text-xl font-bold text-blue-800">
                                {data.currentPVs} PV
                              </p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                              <p className="text-sm text-purple-700 mb-1">
                                PV閾値
                              </p>
                              <p className="text-xl font-bold text-purple-800">
                                {data.threshold} PV
                              </p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                              <p className="text-sm text-green-700 mb-1">
                                広告料
                              </p>
                              <p className="text-xl font-bold text-green-800">
                                {data.adFee} XYM
                              </p>
                            </div>
                          </div>

                          {/* PV達成ステータスバー */}
                          <div className="mb-4">
                            <div className="flex justify-between mb-2 text-sm">
                              <span className="font-medium">PV達成状況</span>
                              <span>
                                {data.currentPVs}/{data.threshold} PV (
                                {pvPercentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full ${
                                  thresholdReached
                                    ? "bg-green-500"
                                    : "bg-amber-500"
                                }`}
                                style={{ width: `${pvPercentage}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* トピックの記事一覧 */}
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2 flex items-center">
                              <Layers className="h-4 w-4 mr-1 text-muted-foreground" />
                              このトピックの記事
                            </h4>
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>記事タイトル</TableHead>
                                    <TableHead className="text-right">
                                      PV数
                                    </TableHead>
                                    <TableHead className="text-right">
                                      作成者
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {data.articles.map((article) => (
                                    <TableRow key={article.id}>
                                      <TableCell className="font-medium">
                                        <Link
                                          href={`/article/${article.id}`}
                                          className="hover:underline text-primary"
                                        >
                                          {article.title}
                                        </Link>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {article.views || 0} PV
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {article.author}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>

                          {/* 支払いアクション */}
                          <div className="mt-6 flex justify-end">
                            {thresholdReached ? (
                              <Button
                                onClick={() => {
                                  // 対応するPageViewDataを見つける
                                  const relevantPV = pageViews.find(
                                    (pv) => pv.topicId === Number(topicId)
                                  );
                                  if (relevantPV && canPay(relevantPV)) {
                                    openPaymentDialog(relevantPV);
                                  }
                                }}
                                disabled={
                                  !pageViews.some(
                                    (pv) =>
                                      pv.topicId === Number(topicId) &&
                                      canPay(pv)
                                  )
                                }
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <DollarSign className="h-4 w-4 mr-2" />
                                広告料を支払う
                              </Button>
                            ) : (
                              <div className="flex items-center text-sm text-amber-600">
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                <span>PV閾値未達成のため支払いできません</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 支払い履歴タブ */}
          <TabsContent value="payment-history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-primary" />
                  広告料支払い履歴
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>広告料支払い履歴一覧</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>トピック</TableHead>
                      <TableHead>年/月</TableHead>
                      <TableHead className="text-right">PV数</TableHead>
                      <TableHead className="text-right">閾値</TableHead>
                      <TableHead className="text-right">広告料</TableHead>
                      <TableHead className="text-right">ステータス</TableHead>
                      <TableHead className="text-right">アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageViews.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          支払いデータがありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageViews.map((pageView) => (
                        <TableRow key={pageView.id}>
                          <TableCell>{pageView.topic.title}</TableCell>
                          <TableCell>
                            {pageView.year}/{pageView.month}
                          </TableCell>
                          <TableCell className="text-right">
                            {pageView.pageViews}
                          </TableCell>
                          <TableCell className="text-right">
                            {pageView.topic.monthlyPVThreshold}
                          </TableCell>
                          <TableCell className="text-right">
                            {pageView.topic.adFee} XYM
                          </TableCell>
                          <TableCell className="text-right">
                            {pageView.isPaid ? (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800 border-green-200"
                              >
                                支払い済み
                              </Badge>
                            ) : pageView.isConfirmed ? (
                              pageView.pageViews >=
                              pageView.topic.monthlyPVThreshold ? (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-100 text-blue-800 border-blue-200"
                                >
                                  支払い待ち
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-100 text-amber-800 border-amber-200"
                                >
                                  閾値未達
                                </Badge>
                              )
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-gray-100 text-gray-800 border-gray-200"
                              >
                                未確定
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {canPay(pageView) ? (
                              <Button
                                onClick={() => openPaymentDialog(pageView)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                支払う
                              </Button>
                            ) : pageView.isPaid ? (
                              <div className="flex items-center justify-end text-green-600">
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                <span className="text-xs">完了</span>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" disabled>
                                未対応
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 支払いダイアログ */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>広告料の支払い</DialogTitle>
            <DialogDescription>
              {currentPageView
                ? `${currentPageView.topic.title}の${currentPageView.year}年${currentPageView.month}月分の広告料を支払います。`
                : "広告料を支払います。"}
            </DialogDescription>
          </DialogHeader>

          {paymentSuccess ? (
            <div className="py-6 flex flex-col items-center justify-center">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-medium text-center mb-2">
                支払いが完了しました
              </h3>
              <p className="text-center text-muted-foreground">
                広告料の支払いが正常に処理されました。
              </p>
            </div>
          ) : (
            <>
              <div className="py-4">
                {currentPageView && (
                  <div className="bg-muted p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">トピック:</p>
                        <p className="font-medium">
                          {currentPageView.topic.title}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">期間:</p>
                        <p className="font-medium">
                          {currentPageView.year}年{currentPageView.month}月
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">PV数:</p>
                        <p className="font-medium">
                          {currentPageView.pageViews}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">閾値:</p>
                        <p className="font-medium">
                          {currentPageView.topic.monthlyPVThreshold}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">支払金額:</p>
                        <p className="font-bold text-lg text-primary">
                          {currentPageView.topic.adFee} XYM
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">秘密鍵を入力</p>
                    <Input
                      type="password"
                      placeholder="秘密鍵を入力してください"
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      秘密鍵は安全に処理され、保存されません
                    </p>
                  </div>

                  {paymentError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>エラー</AlertTitle>
                      <AlertDescription>{paymentError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPaymentDialogOpen(false)}
                  disabled={paymentProcessing}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={!privateKey || paymentProcessing}
                >
                  {paymentProcessing ? "処理中..." : "支払いを実行"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
