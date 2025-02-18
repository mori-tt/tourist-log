"use client";

import { useSession, signIn } from "next-auth/react";
import { useArticles } from "@/context/ArticlesContext";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyArticlesPage() {
  const { data: session, status } = useSession();
  const { articles } = useArticles();

  if (status === "loading") return <p>Loading...</p>;
  if (!session) {
    signIn();
    return null;
  }

  // 現在のユーザーが投稿した記事のみフィルタリング
  const myArticles = articles.filter(
    (article) => article.author === session.user.email
  );

  return (
    <Card className="m-8 p-8">
      <CardHeader>
        <CardTitle>私の記事</CardTitle>
      </CardHeader>
      <CardContent>
        {myArticles.length === 0 ? (
          <p>まだ記事を投稿していません。</p>
        ) : (
          <ul className="space-y-4">
            {myArticles.map((article) => (
              <li key={article.id} className="border p-4 rounded">
                <h2 className="text-xl font-semibold">
                  <Link href={`/article/${article.id}`}>{article.title}</Link>
                </h2>
                <p>{article.content.substring(0, 100)}...</p>
                <Link
                  href={`/article/${article.id}/edit`}
                  className="text-blue-500 underline"
                >
                  編集
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
