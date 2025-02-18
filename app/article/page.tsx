"use client";

import React, { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useArticles } from "@/context/ArticlesContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import ReactMde from "react-mde";
import * as Showdown from "showdown";
import "react-mde/lib/styles/css/react-mde-all.css";
import { Input } from "@/components/ui/input";

interface ArticleFormData {
  title: string;
  content: string;
  topicId: string;
  purchaseAmount: number;
}

export default function UserArticleForm() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const { articles, addArticle } = useArticles();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ArticleFormData>();
  const [selectedTab, setSelectedTab] = useState<"write" | "preview">("write");
  const [markdown, setMarkdown] = useState("");
  const [editorHeight, setEditorHeight] = useState(300);

  useEffect(() => {
    setEditorHeight(window.innerHeight * 0.7);
  }, []);

  if (status === "loading") return <p>Loading...</p>;
  if (!session) {
    signIn();
    return null;
  }
  if (session.user.isAdvertiser || session.user.isAdmin) {
    return <p>一般ユーザーのみ記事の投稿が可能です。</p>;
  }

  const topicId = Number(params.topicId);
  const filteredArticles = articles.filter(
    (article) => article.topicId === topicId
  );

  const converter = new Showdown.Converter({
    tables: true,
    simplifiedAutoLink: true,
    strikethrough: true,
    tasklists: true,
  });

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    const items = clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          try {
            const base64 = await fileToBase64(file);
            const imageMarkdown = `![Image](${base64})\n`;
            const updatedMarkdown = markdown + imageMarkdown;
            setMarkdown(updatedMarkdown);
            setValue("content", updatedMarkdown);
          } catch (error) {
            console.error("画像変換エラー:", error);
          }
        }
      }
    }
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const onSubmit = async (data: ArticleFormData) => {
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          topicId: topicId,
          purchaseAmount: data.purchaseAmount,
          author: session.user.email,
        }),
      });
      if (res.ok) {
        const createdArticle = await res.json();
        addArticle(createdArticle);
        alert("記事が正常に投稿されました");
        router.push("/topics");
      } else {
        alert("記事の投稿に失敗しました");
      }
    } catch (error) {
      console.error("投稿エラー:", error);
      alert("記事の投稿中にエラーが発生しました");
    }
  };

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
                <p className="text-sm text-gray-600">
                  買取金額: {article.tipAmount} 円
                </p>
                <p className="text-sm text-gray-600">
                  投げ銭合計: {article.tipAmount} 円
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {/* 新規記事を作成する */}
      <h2 className="text-xl font-bold mt-6 mb-4">新規記事を作成</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            placeholder="記事タイトル"
            {...register("title", { required: "タイトルは必須です。" })}
          />
          {errors.title && (
            <span className="text-red-500">{errors.title.message}</span>
          )}
        </div>
        <div>
          <Input
            type="number"
            placeholder="買取金額"
            {...register("purchaseAmount", {
              required: "買取金額は必須です",
              valueAsNumber: true,
            })}
          />
          {errors.purchaseAmount && (
            <span className="text-red-500">
              {errors.purchaseAmount.message}
            </span>
          )}
        </div>
        <div>
          <ReactMde
            value={markdown}
            onChange={(value) => {
              setMarkdown(value);
              setValue("content", value);
            }}
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
            generateMarkdownPreview={(markdown) =>
              Promise.resolve(converter.makeHtml(markdown))
            }
            minEditorHeight={editorHeight}
            childProps={{
              textArea: { onPaste: handlePaste },
            }}
          />
          {errors.content && (
            <span className="text-red-500">{errors.content.message}</span>
          )}
        </div>
        <Button type="submit">投稿する</Button>
      </form>
    </Card>
  );
}
