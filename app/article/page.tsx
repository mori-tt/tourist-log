"use client";

import { useArticles } from "@/context/ArticlesContext";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useSession, signIn } from "next-auth/react";
import { useTopics } from "@/context/TopicsContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ArticleFormData {
  title: string;
  content: string;
  topicId: number;
}

export default function ArticlePostPage() {
  const { data: session, status } = useSession();
  const { addArticle } = useArticles();
  const { topics } = useTopics();
  const { register, handleSubmit, reset } = useForm<ArticleFormData>();

  if (status === "loading") return <p>Loading...</p>;
  if (!session) {
    signIn();
    return null;
  }

  const onSubmit = async (data: ArticleFormData) => {
    const newArticleData = {
      title: data.title,
      content: data.content,
      topicId: data.topicId,
      author: session.user.email || "",
    };

    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newArticleData),
    });
    if (res.ok) {
      const createdArticle = await res.json();
      addArticle(createdArticle);
      reset();
    } else {
      console.error("記事の保存に失敗しました");
    }
  };

  return (
    <Card className="m-8 p-8">
      <CardHeader>
        <CardTitle>記事投稿</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1">タイトル</label>
            <Input
              placeholder="記事のタイトル"
              {...register("title", { required: true })}
            />
          </div>
          <div>
            <label className="block mb-1">内容</label>
            <Textarea
              placeholder="記事の内容"
              {...register("content", { required: true })}
            />
          </div>
          <div>
            <label className="block mb-1">トピック選択</label>
            <select
              {...register("topicId", { required: true, valueAsNumber: true })}
              className="block w-full p-2 border rounded"
            >
              <option value="">トピックを選択</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit">記事を投稿</Button>
        </form>
      </CardContent>
      <div className="mt-4">
        <Link href="/articles">
          <Button variant="outline">記事一覧へ</Button>
        </Link>
      </div>
    </Card>
  );
}
