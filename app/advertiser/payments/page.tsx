"use client";

import React, { useState, useEffect } from "react";
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

export default function PaymentsPage() {
  const { data: session, status } = useSession();
  const [pageViews, setPageViews] = useState<PageViewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 支払いダイアログ用の状態
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPageView, setSelectedPageView] = useState<PageViewData | null>(
    null
  );
  const [walletPrivateKey, setWalletPrivateKey] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // データ取得
  const fetchData = async () => {
    try {
      setLoading(true);
      // PV数一覧を取得
      const pageViewsRes = await fetch("/api/pageviews");
      const pageViewsData = await pageViewsRes.json();

      setPageViews(pageViewsData);
      setLoading(false);
    } catch (error) {
      console.error("データの取得に失敗しました:", error);
      setError("データの取得に失敗しました");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  if (status === "loading") return <p>Loading...</p>;
  if (!session) {
    signIn();
    return null;
  }

  // 広告主または管理者のみアクセス可能
  const isAdmin = session.user?.isAdmin;
  const isAdvertiser = session.user?.isAdvertiser;

  if (!isAdvertiser && !isAdmin) {
    return (
      <Card className="m-8">
        <CardContent>
          <p className="mt-4">このページへのアクセス権限がありません。</p>
        </CardContent>
      </Card>
    );
  }

  // 支払い処理
  const handlePayment = async () => {
    if (!selectedPageView) return;

    try {
      setIsProcessing(true);
      setPaymentError("");

      const response = await fetch("/api/transactions/advertise-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          advertiserWalletPrivateKey: walletPrivateKey,
          pageViewId: selectedPageView.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setPaymentDialogOpen(false);
        setWalletPrivateKey("");
        setSuccessMessage(
          `広告費の支払いが完了しました。${result.paidCount}人のユーザーに支払いました。`
        );
        // 最新データを再取得
        fetchData();
      } else {
        const errorData = await response.json();
        setPaymentError(errorData.error || "支払い処理に失敗しました");
      }
    } catch (error) {
      console.error("支払い処理エラー:", error);
      setPaymentError("支払い処理中にエラーが発生しました");
    } finally {
      setIsProcessing(false);
    }
  };

  // 支払いダイアログを開く
  const openPaymentDialog = (pageView: PageViewData) => {
    setSelectedPageView(pageView);
    setPaymentDialogOpen(true);
    setPaymentError("");
  };

  // 支払いが可能か判定
  const canPay = (pageView: PageViewData) => {
    if (pageView.isPaid) return false; // 既に支払い済み
    if (!pageView.isConfirmed) return false; // まだ確定していない

    // PVがしきい値未満は支払い不要
    if (pageView.pageViews < pageView.topic.monthlyPVThreshold) return false;

    // 管理者は常に支払い可能
    if (isAdmin) return true;

    // 広告主の場合、自分のトピックかつ10日以降
    const now = new Date();
    const isPaymentDate = now.getDate() >= 10;
    return (
      pageView.topic.advertiser.email === session.user.email && isPaymentDate
    );
  };

  // 現在の日付
  const now = new Date();
  const isAfterTenthDay = now.getDate() >= 10;

  return (
    <Card className="m-8">
      <CardHeader>
        <CardTitle>広告費支払い管理</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>データを読み込み中...</p>
        ) : (
          <>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {successMessage && (
              <p className="text-green-500 mb-4">{successMessage}</p>
            )}

            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                広告費支払い一覧
                {!isAfterTenthDay && !isAdmin && (
                  <span className="text-yellow-500 ml-2">
                    (支払い開始日は毎月10日からです)
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500">
                ※ PV数が支払い基準に達したトピックの広告費を支払います。
              </p>
            </div>

            <Table>
              <TableCaption>広告費支払い一覧</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>トピック</TableHead>
                  <TableHead>年月</TableHead>
                  <TableHead>月間PV閾値</TableHead>
                  <TableHead>実績PV数</TableHead>
                  <TableHead>広告料(XYM)</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageViews
                  .filter(
                    (pv) =>
                      // 広告主は自分のトピックのみ表示、管理者は全て表示
                      isAdmin ||
                      pv.topic.advertiser.email === session.user.email
                  )
                  .filter(
                    (pv) =>
                      // 確定済みのみ表示
                      pv.isConfirmed
                  )
                  .map((pageView) => {
                    // PV数が基準に達しているか
                    const isEligibleForPayment =
                      pageView.pageViews >= pageView.topic.monthlyPVThreshold;

                    return (
                      <TableRow key={pageView.id}>
                        <TableCell>{pageView.topic.title}</TableCell>
                        <TableCell>
                          {pageView.year}年{pageView.month}月
                        </TableCell>
                        <TableCell>
                          {pageView.topic.monthlyPVThreshold}
                        </TableCell>
                        <TableCell>{pageView.pageViews}</TableCell>
                        <TableCell>
                          {isEligibleForPayment ? (
                            <span className="font-medium">
                              {pageView.topic.adFee} XYM
                            </span>
                          ) : (
                            <span className="text-gray-500">
                              0 XYM (基準未達)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {pageView.isPaid ? (
                            <span className="text-green-500">
                              支払い済み (
                              {new Date(
                                pageView.paidAt as string
                              ).toLocaleDateString()}
                              )
                            </span>
                          ) : isEligibleForPayment ? (
                            <span className="text-yellow-500">支払い待ち</span>
                          ) : (
                            <span className="text-gray-500">支払い不要</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {canPay(pageView) && (
                            <Button
                              onClick={() => openPaymentDialog(pageView)}
                              size="sm"
                              variant="outline"
                            >
                              支払い実行
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>

      {/* 支払いダイアログ */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>広告費の支払い</DialogTitle>
            <DialogDescription>
              {selectedPageView && (
                <>
                  <p className="mb-2">
                    <strong>{selectedPageView.topic.title}</strong>の
                    {selectedPageView.year}年{selectedPageView.month}
                    月分の広告費
                    <strong> {selectedPageView.topic.adFee} XYM </strong>
                    を支払います。
                  </p>
                  <p>支払いに使用するウォレットの秘密鍵を入力してください。</p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="privateKey" className="text-right">
                秘密鍵
              </label>
              <Input
                id="privateKey"
                type="password"
                className="col-span-3"
                value={walletPrivateKey}
                onChange={(e) => setWalletPrivateKey(e.target.value)}
                placeholder="Symbolウォレットの秘密鍵"
              />
            </div>
            {paymentError && <p className="text-red-500">{paymentError}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
              disabled={isProcessing}
            >
              キャンセル
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing || !walletPrivateKey}
            >
              {isProcessing ? "処理中..." : "支払い実行"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
