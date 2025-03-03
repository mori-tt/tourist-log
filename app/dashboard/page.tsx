"use client";

import React from "react";
import { useSession, signIn } from "next-auth/react";
import { useTopics } from "@/context/TopicsContext";
import { useArticles } from "@/context/ArticlesContext";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import WalletAddressAlert from "@/components/WalletAddressAlert";

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
      {/* ウォレットアドレス警告表示 */}
      <WalletAddressAlert />

      {/* 共通セクション - プロフィール設定 */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">アカウント設定</h2>
        <div className="flex space-x-4">
          <Link href="/profile">
            <Button variant="outline">プロフィール設定</Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Symbolウォレットアドレスを設定して、投げ銭や記事購入、広告費の支払いが可能になります。
        </p>
      </section>

      {/* 広告主の場合 */}
      {isAdvertiser && (
        <div>
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">新規トピック作成</h2>
            <Link href="/topics/new">
              <Button className="mr-4">新規トピック作成</Button>
            </Link>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">広告主機能</h2>
            <div className="flex space-x-4">
              <Link href="/advertiser/pageviews">
                <Button variant="outline">PV数入力</Button>
              </Link>
              <Link href="/advertiser/payments">
                <Button variant="outline">広告費支払い</Button>
              </Link>
            </div>
          </section>
        </div>
      )}

      {/* 一般ユーザーの場合 */}
      {isGeneral && (
        <div>
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">新規記事作成</h2>
            <Link href="/article/new">
              <Button>新規記事作成</Button>
            </Link>
          </section>
        </div>
      )}

      {(isAdvertiser || isAdmin || isGeneral) && (
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
                      広告料: {topic.adFee}XYM
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      月間PV支払い基準: {topic.monthlyPVThreshold}
                    </p>
                    <div className="flex justify-end mb-4">
                      <Link href={`/topics/${topic.id}`}>
                        <Button variant="outline" size="sm">
                          詳細
                        </Button>
                      </Link>
                    </div>

                    {articles
                      .filter((article) => article.topicId === topic.id)
                      .filter((article) => {
                        // 購入済み記事のアクセス制御
                        if (!article.isPurchased) {
                          // 未購入記事は誰でも閲覧可能
                          return true;
                        }
                        // 購入済み記事は投稿者、購入者、管理者のみ閲覧可能
                        return (
                          isAdmin ||
                          article.author === session.user.email ||
                          article.purchasedBy === session.user.id
                        );
                      })
                      .map((article) => (
                        <Card key={article.id} className="mb-2">
                          <CardHeader>
                            <CardTitle className="text-lg font-bold">
                              {article.title}
                              {article.isPurchased && (
                                <span className="ml-2 text-sm text-green-600">
                                  (購入済み)
                                </span>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div>
                              <p>{article.content.slice(0, 100)}...</p>
                              <p className="text-sm text-gray-500 mt-4">
                                更新日時: {article.updatedAt.split("T")[0]}
                              </p>
                              <p className="text-sm text-gray-500">
                                作者: {article.author}
                              </p>
                              <p className="text-sm text-gray-500 mb-4">
                                買取金額: {article.xymPrice}XYM
                              </p>
                            </div>
                            <Link href={`/article/${article.id}`}>
                              <Button variant="outline" size="sm">
                                詳細
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      ))}
                  </CardContent>
                </Card>
              ))
            )}
          </section>
        </div>
      )}
    </div>
  );
}
