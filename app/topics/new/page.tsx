"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function NewTopicPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // すべてのHooksを最初に宣言
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [adFee, setAdFee] = useState("");
  const [monthlyPVThreshold, setMonthlyPVThreshold] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session || !session.user?.isAdvertiser) {
    return <div>権限がありません。</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          adFee: Number(adFee),
          monthlyPVThreshold: Number(monthlyPVThreshold),
          advertiserId: session.user.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "トピックの投稿に失敗しました");
      }
      router.push("/topics");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("トピックの投稿中にエラーが発生しました");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">新しいトピックを投稿</h1>
      {error && <p className="text-red-500">{error}</p>}
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
          <label className="block mb-1">説明</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1">広告料 (XYM)</label>
            <Input
              type="number"
              min="0"
              value={adFee}
              onChange={(e) => setAdFee(e.target.value)}
              placeholder="例: 500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              PV達成時に支払う広告料金
            </p>
          </div>
          <div>
            <label className="block mb-1">月間PV基準</label>
            <Input
              type="number"
              min="0"
              value={monthlyPVThreshold}
              onChange={(e) => setMonthlyPVThreshold(e.target.value)}
              placeholder="例: 1000"
              required
            />
            <p className="text-sm text-gray-500 mt-1">広告料金を支払うPV閾値</p>
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "投稿中..." : "投稿する"}
        </Button>
      </form>
    </div>
  );
}
