"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Topic } from "@/context/TopicsContext";

interface PageViewData {
  id: number;
  topicId: number;
  year: number;
  month: number;
  pageViews: number;
  isConfirmed: boolean;
  isPaid: boolean;
  topic: {
    title: string;
    adFee: number;
    monthlyPVThreshold: number;
  };
}

export default function PageViewsPage() {
  const { data: session, status } = useSession();
  const [pageViews, setPageViews] = useState<PageViewData[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValues, setInputValues] = useState<{ [key: number]: number }>({});
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 現在の年月を取得
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // 先月の年月を計算
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  // データ取得
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // トピック一覧を取得
      const topicsRes = await fetch("/api/topics");
      const topicsData = await topicsRes.json();

      // PV数一覧を取得
      const pageViewsRes = await fetch("/api/pageviews");
      const pageViewsData = await pageViewsRes.json();

      setTopics(topicsData);
      setPageViews(pageViewsData);

      // 入力値の初期化
      const initialValues: { [key: number]: number } = {};
      topicsData.forEach((topic: Topic) => {
        const existingPageView = pageViewsData.find(
          (pv: PageViewData) =>
            pv.topicId === topic.id &&
            pv.year === lastMonthYear &&
            pv.month === lastMonth
        );

        initialValues[topic.id] = existingPageView?.pageViews || 0;
      });

      setInputValues(initialValues);
      setLoading(false);
    } catch (error) {
      console.error("データの取得に失敗しました:", error);
      setError("データの取得に失敗しました");
      setLoading(false);
    }
  }, [lastMonth, lastMonthYear]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, fetchData]);

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

  // 入力値の変更ハンドラ
  const handleInputChange = (topicId: number, value: string) => {
    setInputValues({
      ...inputValues,
      [topicId]: parseInt(value) || 0,
    });
  };

  // PV数を保存
  const handleSavePageViews = async (topicId: number) => {
    try {
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/pageviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicId,
          year: lastMonthYear,
          month: lastMonth,
          pageViews: inputValues[topicId],
        }),
      });

      if (response.ok) {
        setSuccessMessage(`トピックID: ${topicId} のPV数を保存しました`);
        // 最新データを再取得
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "PV数の保存に失敗しました");
      }
    } catch (error) {
      console.error("PV数の保存エラー:", error);
      setError("PV数の保存処理に失敗しました");
    }
  };

  // PV数と支払い金額を計算
  const calculatePayment = (
    pageViews: number,
    adFee: number,
    threshold: number
  ) => {
    if (pageViews < threshold) {
      return 0; // しきい値未満は支払いなし
    }
    return adFee;
  };

  // 入力期限内かどうか
  const isWithinDeadline = now.getDate() <= 5;

  return (
    <Card className="m-8">
      <CardHeader>
        <CardTitle>月間PV数の管理</CardTitle>
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
                {lastMonthYear}年{lastMonth}月のPV数入力
                {!isWithinDeadline && !isAdmin && (
                  <span className="text-red-500 ml-2">
                    (入力期限を過ぎています)
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500">
                ※ 先月のPV数を入力してください。入力期限は翌月5日までです。
              </p>
            </div>

            <Table>
              <TableCaption>月間PV数と広告費</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>トピック</TableHead>
                  <TableHead>月間PV閾値</TableHead>
                  <TableHead>広告料(XYM)</TableHead>
                  <TableHead>PV数</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>広告費支払額</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topics
                  .filter(
                    (topic) => isAdmin || topic.advertiserId === session.user.id
                  )
                  .map((topic) => {
                    const existingPageView = pageViews.find(
                      (pv) =>
                        pv.topicId === topic.id &&
                        pv.year === lastMonthYear &&
                        pv.month === lastMonth
                    );

                    const isEditable =
                      (isWithinDeadline || isAdmin) &&
                      !existingPageView?.isConfirmed;
                    const payment = calculatePayment(
                      inputValues[topic.id] || 0,
                      topic.adFee,
                      topic.monthlyPVThreshold
                    );

                    return (
                      <TableRow key={topic.id}>
                        <TableCell>{topic.title}</TableCell>
                        <TableCell>{topic.monthlyPVThreshold}</TableCell>
                        <TableCell>{topic.adFee}</TableCell>
                        <TableCell>
                          {isEditable ? (
                            <Input
                              type="number"
                              min="0"
                              value={inputValues[topic.id] || 0}
                              onChange={(e) =>
                                handleInputChange(topic.id, e.target.value)
                              }
                            />
                          ) : (
                            existingPageView?.pageViews || "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {existingPageView ? (
                            existingPageView.isPaid ? (
                              <span className="text-green-500">支払い済み</span>
                            ) : existingPageView.isConfirmed ? (
                              <span className="text-blue-500">確定済み</span>
                            ) : (
                              <span className="text-yellow-500">未確定</span>
                            )
                          ) : (
                            <span className="text-gray-500">未入力</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {payment > 0 ? (
                            <span className="font-medium">{payment} XYM</span>
                          ) : (
                            <span className="text-gray-500">0 XYM</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditable && (
                            <Button
                              onClick={() => handleSavePageViews(topic.id)}
                              size="sm"
                            >
                              保存
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
    </Card>
  );
}
