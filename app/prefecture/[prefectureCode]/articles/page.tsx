"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useArticles } from "@/context/ArticlesContext";
import { useTopics } from "@/context/TopicsContext";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { getPrefectureByCode } from "@/lib/data/prefectures";

export default function PrefectureArticlesPage() {
  const params = useParams();
  const prefectureCode = params.prefectureCode as string;
  const prefecture = getPrefectureByCode(prefectureCode);

  const { data: session, status } = useSession();
  const { articles } = useArticles();
  const { topics } = useTopics();
  const [authorNames, setAuthorNames] = useState<{ [key: string]: string }>({});
  const [topicNames, setTopicNames] = useState<{ [key: number]: string }>({});

  // ユーザー名を非同期に取得する関数
  const fetchUserName = async (userId: string) => {
    try {
      const res = await fetch(`/api/user/${userId}`);
      if (res.ok) {
        const userData = await res.json();
        return userData.name || "名前未設定";
      }
    } catch (error) {
      console.error("ユーザー名の取得に失敗しました:", error);
    }
    return "不明なユーザー";
  };

  // 記事の著者名を取得
  useEffect(() => {
    const getAuthorNames = async () => {
      const nameMap: { [key: string]: string } = {};
      for (const article of articles) {
        if (article.userId && !nameMap[article.userId]) {
          nameMap[article.userId] = await fetchUserName(article.userId);
        }
      }
      setAuthorNames(nameMap);
    };

    // トピック名を取得する
    const getTopicNames = () => {
      const nameMap: { [key: number]: string } = {};
      for (const topic of topics) {
        nameMap[topic.id] = topic.title;
      }
      setTopicNames(nameMap);
    };

    getAuthorNames();
    getTopicNames();
  }, [articles, topics]);

  if (status === "loading") return <p>Loading...</p>;
  if (!prefecture) return <p>都道府県が見つかりません</p>;

  // ログイン状態に応じた表示内容調整
  const isAdmin = session?.user?.isAdmin;

  // この都道府県に関連するトピックを取得
  const prefectureTopics = topics.filter((topic) => {
    const prefectureName = prefecture.name;
    const prefectureNameWithoutSuffix = prefectureName.replace(
      /[都道府県]$/,
      ""
    );
    return (
      topic.title.includes(prefectureName) ||
      topic.title.includes(prefectureNameWithoutSuffix) ||
      topic.content.includes(prefectureName) ||
      topic.content.includes(prefectureNameWithoutSuffix)
    );
  });

  // この都道府県のトピックIDリスト
  const prefectureTopicIds = prefectureTopics.map((topic) => topic.id);

  // この都道府県に関連する記事をフィルタリング
  const filteredArticles = articles.filter((article) => {
    // トピックに紐づいている記事
    if (article.topicId && prefectureTopicIds.includes(article.topicId)) {
      return true;
    }

    // 記事のタイトルや内容に都道府県名が含まれている場合
    const prefectureName = prefecture.name;
    const prefectureNameWithoutSuffix = prefectureName.replace(
      /[都道府県]$/,
      ""
    );
    return (
      article.title.includes(prefectureName) ||
      article.title.includes(prefectureNameWithoutSuffix) ||
      article.content.includes(prefectureName) ||
      article.content.includes(prefectureNameWithoutSuffix)
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* 都道府県ヘッダー */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{prefecture.name}の記事一覧</h1>
          <div className="flex space-x-2">
            <Link href={`/prefecture/${prefecture.code}`}>
              <Button variant="outline">{prefecture.name}のトップに戻る</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">サイトトップに戻る</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 記事一覧 */}
      <section>
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-xl text-muted-foreground mb-4">
              まだ記事はありません
            </p>
            {session && (
              <div className="mt-6">
                <Link href="/article/new">
                  <Button>{prefecture.name}の記事を投稿する</Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                全 {filteredArticles.length} 件の記事
              </h2>
              {session && (
                <Link href="/article/new">
                  <Button variant="outline" size="sm">
                    新しい記事を投稿する
                  </Button>
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles
                .filter((article) => {
                  // 未ログインの場合は未購入の記事のみ表示
                  if (!session) return !article.isPurchased;

                  // 購入済み記事のアクセス制御
                  if (!article.isPurchased) {
                    // 未購入記事は誰でも閲覧可能
                    return true;
                  }
                  // 購入済み記事は投稿者、購入者、管理者のみ閲覧可能
                  return (
                    isAdmin ||
                    article.userId === session.user.id ||
                    article.purchasedBy === session.user.id
                  );
                })
                .sort(
                  (a, b) =>
                    new Date(b.updatedAt).getTime() -
                    new Date(a.updatedAt).getTime()
                )
                .map((article) => (
                  <Card key={article.id} className="mb-4 flex flex-col h-full">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold">
                        {article.title}
                        {article.isPurchased && (
                          <span className="ml-2 text-xs text-green-600">
                            (購入済み)
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>
                            {article.content.slice(0, 100) + "..."}
                          </ReactMarkdown>
                        </div>
                        <div className="mt-4 space-y-1 text-sm text-gray-500">
                          <p>
                            投稿者:{" "}
                            {authorNames[article.userId] || "不明なユーザー"}
                          </p>
                          {article.topicId && (
                            <p>
                              トピック:{" "}
                              {topicNames[article.topicId] || "不明なトピック"}
                            </p>
                          )}
                          <p>更新日時: {article.updatedAt.split("T")[0]}</p>
                          <p>買取金額: {article.xymPrice}XYM</p>
                        </div>
                      </div>
                      <div className="mt-6">
                        <Link href={`/article/${article.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            記事を読む
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
