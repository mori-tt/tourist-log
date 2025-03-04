"use client";

import React, { useState, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useArticles } from "@/context/ArticlesContext";
import { ArticleFormData } from "@/types/article";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import ReactMde from "react-mde";
import * as Showdown from "showdown";
import "react-mde/lib/styles/css/react-mde-all.css";
import { Input } from "@/components/ui/input";
import SafeImage from "@/components/SafeImage";

export default function UserArticleForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addArticle } = useArticles();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ArticleFormData>();
  const [selectedTab, setSelectedTab] = useState<"write" | "preview">("write");
  const [markdown, setMarkdown] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const converter = new Showdown.Converter({
    tables: true,
    simplifiedAutoLink: true,
    strikethrough: true,
    asklists: true,
  });

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    void e; // Mark the event as used to satisfy ESLint
    // 必要に応じてペースト処理を実装
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setUploadedImages((prev) => [...prev, data.url]);
      } else {
        console.error("画像のアップロードに失敗しました");
      }
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  if (status === "loading") return <p>Loading...</p>;
  if (!session) {
    signIn();
    return null;
  }
  if (session.user.isAdvertiser || session.user.isAdmin) {
    return <p>一般ユーザーのみ記事の投稿が可能です。</p>;
  }

  const onSubmit = async (data: ArticleFormData) => {
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          topicId: Number(data.topicId),
          author: session.user.email,
          userId: session.user.id,
          images: uploadedImages.map((url) => ({ url })),
        }),
      });
      if (res.ok) {
        const createdArticle = await res.json();
        addArticle(createdArticle);
        alert("記事が正常に投稿されました");
        router.push("/");
      } else {
        alert("記事の投稿に失敗しました");
      }
    } catch (error) {
      console.error("投稿エラー:", error);
      alert("記事の投稿中にエラーが発生しました");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>記事作成</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Input
              placeholder="記事タイトル"
              {...register("title", { required: true })}
            />
            {errors.title && <span>タイトルは必須です</span>}
          </div>
          <div>
            <Input
              type="number"
              placeholder="買取金額"
              {...register("xymPrice", {
                required: true,
                valueAsNumber: true,
              })}
            />
            {errors.xymPrice && <span>買取金額は必須です</span>}
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
              childProps={{ textArea: { onPaste: handlePaste } }}
            />
            {errors.content && <span>本文は必須です</span>}
          </div>
          <div>
            <Button type="button" onClick={handleImageButtonClick}>
              画像追加
            </Button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {uploadedImages.map((url, index) => (
                <div key={index} className="relative h-32">
                  <SafeImage
                    src={url}
                    alt={`Uploaded ${index}`}
                    fill
                    className="object-cover border rounded"
                  />
                </div>
              ))}
            </div>
          )}
          <div>
            <label>トピック</label>
            <select {...register("topicId", { required: true })}>
              <option value="">トピックを選択</option>
              {/* トピック一覧を適宜表示 */}
            </select>
          </div>
          <Button type="submit">投稿する</Button>
        </form>
      </CardContent>
    </Card>
  );
}
