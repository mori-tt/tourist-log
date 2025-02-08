"use client";

import { useSession, signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTopics } from "@/context/TopicsContext";
import TopicForm from "@/components/TopicForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TopicsPage() {
  const { data: session, status } = useSession();
  const { topics } = useTopics();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    signIn();
    return null;
  }

  const isAdvertiser = session.user?.isAdvertiser;

  return (
    <div className="space-y-8 p-8">
      {isAdvertiser && (
        <Card>
          <CardHeader>
            <CardTitle>新しいトピックを追加</CardTitle>
          </CardHeader>
          <CardContent>
            <TopicForm />
          </CardContent>
        </Card>
      )}
      <div>
        <h2 className="text-2xl font-bold mb-4">トピック一覧</h2>
        {topics.length === 0 ? (
          <p>まだトピックが設定されていません。</p>
        ) : (
          <ul className="space-y-4">
            {topics.map((topic) => (
              <li key={topic.id} className="border rounded p-4">
                <h3 className="text-xl font-semibold">{topic.title}</h3>
                <p>{topic.content}</p>
                <p>広告料: {topic.adFee} 円</p>
                <p>月間PV支払い基準: {topic.monthlyPVThreshold}</p>
                <Link href={`/topics/${topic.id}/articles`}>
                  <Button className="mt-2">記事を見る・投稿する</Button>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
