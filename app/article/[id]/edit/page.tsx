"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useArticles } from "@/context/ArticlesContext";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMde from "react-mde";
import * as Showdown from "showdown";
import "react-mde/lib/styles/css/react-mde-all.css";

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

  // react-mde用の状態管理
  const [selectedTab, setSelectedTab] = useState<"write" | "preview">("write");
  const [markdown, setMarkdown] = useState(article?.content || "");
  const [editorHeight, setEditorHeight] = useState(300);

  useEffect(() => {
    if (article) {
      setValue("title", article.title);
      setValue("content", article.content);
      setValue("tipAmount", article.tipAmount);
      setMarkdown(article.content);
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

  // markdown変換用のコンバーター設定
  const converter = new Showdown.Converter({
    tables: true,
    simplifiedAutoLink: true,
    strikethrough: true,
    tasklists: true,
  });

  // 画像をペースト時にBase64エンコードする例
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    const items = clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const base64 = reader.result as string;
            const imageMarkdown = `![Image](${base64})\n`;
            const updatedMarkdown = markdown + imageMarkdown;
            setMarkdown(updatedMarkdown);
            setValue("content", updatedMarkdown);
          };
        }
      }
    }
  };

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
