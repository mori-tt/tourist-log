"use client";

import { useSession, signIn } from "next-auth/react";
import { useTopics } from "@/context/TopicsContext";
import { Article, useArticles } from "@/context/ArticlesContext";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { topics } = useTopics();
  const { articles } = useArticles();

  if (status === "loading") return <p>Loading...</p>;
  if (!session) {
    signIn();
    return null;
  }

  // ユーザー属性の判定
  const isAdmin = session.user?.isAdmin;
  const isAdvertiser = session.user?.isAdvertiser;
  const isGeneral = !isAdmin && !isAdvertiser;

  return (
    <div className="p-8 space-y-8">
      {/* 広告主の場合 */}
      {isAdvertiser && (
        <div>
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">新規トピック作成</h2>
            <Link href="/topics/new">
              <Button>新規トピック作成</Button>
            </Link>
          </section>
        </div>
      )}
      {/* 管理者の場合 */}
      {(isAdvertiser || isAdmin) && (
        <div>
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">トピック管理</h2>
            {topics.length === 0 ? (
              <p>トピックはありません。</p>
            ) : (
              topics.map((topic) => (
                <Card key={topic.id} className="mb-4">
                  <CardHeader>
                    <CardTitle>{topic.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">{topic.content}</p>
                    <p className="text-sm text-gray-500">
                      広告料: {topic.adFee}円
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      月間PV支払い基準: {topic.monthlyPVThreshold}
                    </p>
                    <Link href={`/topics/${topic.id}`}>
                      <Button variant="outline" size="sm">
                        詳細
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            )}
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">記事管理</h2>
            {topics.map((topic) => {
              const topicArticles = articles.filter(
                (article) => article.topicId === topic.id
              );
              return (
                <div key={topic.id} className="mb-4">
                  <h3 className="text-xl font-semibold mb-2">
                    {topic.title}の記事
                  </h3>
                  {topicArticles.length === 0 ? (
                    <p>記事がありません。</p>
                  ) : (
                    topicArticles.map((article) => (
                      <Card key={article.id} className="mb-2">
                        <CardHeader>
                          <CardTitle className="text-lg font-bold">
                            {article.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div>
                            <p>{article.content.slice(0, 100)}...</p>
                            {/* 投稿日時 日と時間のみ　*/}
                            <p className="text-sm text-gray-500 mt-4">
                              更新日時: {article.updatedAt.split("T")[0]}
                            </p>
                            <p className="text-sm text-gray-500">
                              作者: {article.author}
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                              買取金額: {article.tipAmount}円
                            </p>
                          </div>

                          <Link href={`/article/${article.id}`}>
                            <Button variant="outline" size="sm">
                              詳細
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              );
            })}
          </section>
        </div>
      )}

      {/* 一般ユーザーの場合 */}
      {isGeneral && (
        <div>
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">新規記事投稿</h2>
            <Link href="/dashboard/articles/new">
              <Button>新規記事投稿</Button>
            </Link>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">私の記事</h2>
            {(() => {
              const myArticles = articles.filter(
                (article) => article.author === session.user.email
              );
              if (myArticles.length === 0) {
                return <p>投稿した記事はありません。</p>;
              }
              // 記事をトピックごとにグループ化
              const articlesByTopic = myArticles.reduce((acc, article) => {
                if (!acc[article.topicId]) acc[article.topicId] = [];
                acc[article.topicId].push(article);
                return acc;
              }, {} as { [key: number]: Article[] });
              return Object.keys(articlesByTopic).map((topicId) => {
                const topicDetails = topics.find(
                  (t) => t.id === Number(topicId)
                );
                return (
                  <div key={topicId} className="mb-4">
                    <h3 className="text-xl font-semibold mb-2">
                      {topicDetails ? topicDetails.title : "トピック情報なし"}
                    </h3>
                    {articlesByTopic[Number(topicId)].map(
                      (article: Article) => (
                        <Card key={article.id} className="mb-2">
                          <CardHeader>
                            <CardTitle className="text-lg font-bold">
                              {article.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div>
                              <p>{article.content.slice(0, 100)}...</p>
                              {/* 投稿日時 日と時間のみ　*/}
                              <p className="text-sm text-gray-500 mt-4">
                                更新日時: {article.updatedAt.split("T")[0]}
                              </p>
                              <p className="text-sm text-gray-500">
                                作者: {article.author}
                              </p>
                              <p className="text-sm text-gray-500 mb-4">
                                買取金額: {article.tipAmount}円
                              </p>
                            </div>

                            <Link href={`/article/${article.id}`}>
                              <Button variant="outline" size="sm">
                                詳細
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                );
              });
            })()}
          </section>
        </div>
      )}
    </div>
  );
}
