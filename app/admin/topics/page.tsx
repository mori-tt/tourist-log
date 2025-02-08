"use client";

import { useSession, signIn } from "next-auth/react";
import { useTopics } from "@/context/TopicsContext";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminTopicsPage() {
  const { data: session, status } = useSession();
  const { topics, deleteTopic } = useTopics();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session || !session.user.isAdmin) {
    signIn();
    return null;
  }

  return (
    <Card className="m-8 p-8">
      <h1 className="text-2xl mb-4">トピック管理</h1>
      {topics.length === 0 ? (
        <p>トピックはありません。</p>
      ) : (
        <ul className="space-y-2">
          {topics.map((topic) => (
            <li
              key={topic.id}
              className="border p-4 rounded flex justify-between items-center"
            >
              <div>
                <h2 className="font-bold">{topic.title}</h2>
              </div>
              <div className="flex gap-2">
                <Link href={`/topics/${topic.id}`}>
                  <Button variant="outline" size="sm">
                    詳細
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteTopic(topic.id)}
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
