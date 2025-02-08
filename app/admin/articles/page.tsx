"use client";

import { useSession, signIn } from "next-auth/react";
import { useArticles } from "@/context/ArticlesContext";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminArticlesPage() {
  const { data: session, status } = useSession();
  const { articles, deleteArticle } = useArticles();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session || !session.user.isAdmin) {
    signIn();
    return null;
  }

  return (
    <Card className="m-8 p-8">
      <h1 className="text-2xl mb-4">記事管理</h1>
      {articles.length === 0 ? (
        <p>記事はありません。</p>
      ) : (
        <ul className="space-y-2">
          {articles.map((article) => (
            <li
              key={article.id}
              className="border p-4 rounded flex justify-between items-center"
            >
              <div>
                <h2 className="font-bold">{article.title}</h2>
                <p className="text-sm text-gray-600">著者: {article.author}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/article/${article.id}`}>
                  <Button variant="outline" size="sm">
                    詳細
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteArticle(article.id)}
                >
                  削除
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
