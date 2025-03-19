"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useTopics } from "@/context/TopicsContext";
import Link from "next/link";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TopicsPage() {
  const { data: session, status } = useSession();
  const { topics } = useTopics();

  if (status === "loading") return <p>Loading...</p>;
  if (!session) {
    // ログインしていなくても閲覧可能に変更
    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">トピック一覧</h1>
        </div>
        {topics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {topics.map((topic) => (
              <Link key={topic.id} href={`/topics/${topic.id}`}>
                <Card className="bg-card shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
                    <CardTitle className="text-xl font-bold">
                      {topic.title}
                    </CardTitle>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {topic.content}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="bg-card shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-12 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold mb-4">
                トピックが見つかりません
              </h2>
              <p className="text-muted-foreground mb-8">
                現在、公開されているトピックはありません。
              </p>
              <Link href="/">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  ホームに戻る
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">トピック一覧</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {topics.map((topic) => (
          <Link key={topic.id} href={`/topics/${topic.id}`}>
            <Card className="bg-card shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
                <CardTitle className="text-xl font-bold">
                  {topic.title}
                </CardTitle>
              </div>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {topic.content}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
