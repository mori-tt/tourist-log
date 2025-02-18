"use client";
import React from "react";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useArticles } from "@/context/ArticlesContext";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ArticleEditFormData {
  title: string;
  content: string;
  tipAmount: number;
}

export default function EditArticlePage() {
  const { data: session, status } = useSession();
  const { articles, updateArticle } = useArticles();
  const params = useParams();
  const articleId = Number(params.id);
  const article = articles.find((a) => a.id === articleId);
  const router = useRouter();
  const { register, handleSubmit, setValue } = useForm<ArticleEditFormData>({
    defaultValues: {
      title: article?.title || "",
      content: article?.content || "",
      tipAmount: article?.tipAmount || 0,
    },
  });

  useEffect(() => {
    if (article) {
      setValue("title", article.title);
      setValue("content", article.content);
      setValue("tipAmount", article.tipAmount);
    }
  }, [article, setValue]);

  if (status === "loading") return <p>Loading...</p>;
  if (!session) {
    signIn();
    return null;
  }
  if (!article || session.user.email !== article.author) {
    return <p>アクセス権がありません。</p>;
  }

  const onSubmit = async (data: ArticleEditFormData) => {
    const res = await fetch(`/api/articles/${articleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updatedArticle = await res.json();
      updateArticle(updatedArticle);
      router.push(`/article/${articleId}`);
    } else {
      console.error("記事更新に失敗しました");
    }
  };

  return (
    <Card className="m-8 p-8">
      <CardHeader>
        <CardTitle>記事編集</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <input
              {...register("title")}
              placeholder="タイトル"
              className="border p-2 w-full"
            />
          </div>
          <div className="mb-4">
            <textarea
              {...register("content")}
              placeholder="内容"
              className="border p-2 w-full h-40"
            />
          </div>
          <div className="mb-4">
            <label>買取金額（円）:</label>
            <input
              type="number"
              min="0"
              {...register("tipAmount", { valueAsNumber: true })}
              className="border p-2 w-full"
            />
          </div>
          <Button type="submit">更新</Button>
        </form>
      </CardContent>
    </Card>
  );
}
