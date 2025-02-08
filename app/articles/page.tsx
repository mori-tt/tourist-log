"use client";

import { useArticles } from "@/context/ArticlesContext";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ArticlesListPage() {
  const { articles } = useArticles();

  return (
    <Card className="m-8 p-8">
      <h1 className="text-2xl mb-4">記事一覧</h1>
      {articles.length === 0 ? (
        <p>記事がありません。</p>
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
              <Link href={`/article/${article.id}`}>
                <Button>詳細</Button>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
