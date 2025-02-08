"use client";

import { useParams } from "next/navigation";
import { useArticles } from "@/context/ArticlesContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TopicArticlesPage() {
  const params = useParams();
  const topicId = Number(params.topicId);
  const { articles } = useArticles();

  // 選択されたトピックに属する記事のみフィルタ
  const filteredArticles = articles.filter(
    (article) => article.topicId === topicId
  );

  return (
    <Card className="m-8 p-8">
      <CardHeader>
        <CardTitle>トピック {topicId} の記事一覧</CardTitle>
      </CardHeader>
      <CardContent>
        {filteredArticles.length === 0 ? (
          <p>このトピックに記事はまだありません。</p>
        ) : (
          <ul className="space-y-4">
            {filteredArticles.map((article) => (
              <li key={article.id} className="border p-4 rounded">
                <h2 className="text-xl font-bold">{article.title}</h2>
                <p>{article.content}</p>
                <p className="text-sm text-gray-600">著者: {article.author}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <div className="mt-4">
        <Link href="/articles">
          <Button variant="outline">全記事一覧へ</Button>
        </Link>
      </div>
    </Card>
  );
}
