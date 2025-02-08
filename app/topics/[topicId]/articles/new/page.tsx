"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NewArticlePage() {
  const router = useRouter();
  const params = useParams();
  const topicId = Number(params.topicId);
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const articleData = {
      title,
      content,
      topicId,
      author: session?.user?.name || session?.user?.email || "anonymous",
    };

    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(articleData),
    });

    if (res.ok) {
      router.push(`/topics/${topicId}/articles`);
    } else {
      console.error("記事の作成に失敗しました");
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="m-8 p-8">
      <CardHeader>
        <CardTitle>新しい記事を作成</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            記事を作成する
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
