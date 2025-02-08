"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useArticles } from "@/context/ArticlesContext";
import { useTopics } from "@/context/TopicsContext";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const { articles } = useArticles();
  const { topics } = useTopics();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session || !session.user.isAdmin) {
    signIn();
    return null;
  }

  return (
    <Card className="m-8 p-8">
      <h1 className="text-2xl mb-4">管理者ダッシュボード</h1>
      <p>管理者用の全機能をここで管理できます。</p>
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex flex-wrap gap-4">
          <Link href="/admin/articles">
            <Button variant="outline">記事管理</Button>
          </Link>
          <Link href="/admin/topics">
            <Button variant="outline">トピック管理</Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="outline">ユーザー管理</Button>
          </Link>
        </div>
        <div>
          <h2 className="text-xl font-semibold mt-4">現在の記事一覧</h2>
          {articles.length === 0 ? (
            <p>記事はありません。</p>
          ) : (
            <ul>
              {articles.map((article) => (
                <li
                  key={article.id}
                  className="border-b py-2 flex justify-between items-center"
                >
                  <span>{article.title}</span>
                  <Link href={`/article/${article.id}`}>
                    <Button variant="outline" size="sm">
                      詳細
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold mt-4">現在のトピック一覧</h2>
          {topics.length === 0 ? (
            <p>トピックはありません。</p>
          ) : (
            <ul>
              {topics.map((topic) => (
                <li
                  key={topic.id}
                  className="border-b py-2 flex justify-between items-center"
                >
                  <span>{topic.title}</span>
                  <Link href={`/topics/${topic.id}`}>
                    <Button variant="outline" size="sm">
                      詳細
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
