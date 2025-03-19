"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTopics } from "@/context/TopicsContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewArticlePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { topics } = useTopics();

  // すべてのフックを条件分岐前に移動
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [topicId, setTopicId] = useState<number>(
    topics.length > 0 ? topics[0].id : 0
  );
  const [xymPrice, setXymPrice] = useState(0);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 広告主は記事投稿ができない
  if (!session || session.user?.isAdvertiser) {
    return <div>広告主は記事の投稿ができません。</div>;
  }

  // トピックが存在しない場合のエラーチェック
  if (topics.length === 0) {
    return (
      <div>
        利用可能なトピックがありません。広告主に新しいトピックを作成していただく必要があります。
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          topicId,
          xymPrice,
          authorId: session.user.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "記事の投稿に失敗しました。");
      }
      router.push("/articles");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("記事の投稿中にエラーが発生しました");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">新しい記事を投稿</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1">タイトル</label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">内容</label>
          <textarea
            className="w-full border rounded-md p-2"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">トピックを選択</label>
          <select
            value={topicId}
            onChange={(e) => setTopicId(Number(e.target.value))}
            className="w-full border rounded-md p-2"
          >
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.title}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1">価格 (XYM)</label>
          <Input
            type="number"
            value={xymPrice}
            onChange={(e) => setXymPrice(Number(e.target.value))}
            required
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "投稿中..." : "投稿する"}
        </Button>
      </form>
    </div>
  );
}
