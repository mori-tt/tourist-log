"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTopics } from "@/context/TopicsContext";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ReactMde from "react-mde";
import "react-mde/lib/styles/css/react-mde-all.css";
import { useArticles, ArticleFormData } from "@/context/ArticlesContext";
import Showdown from "showdown";
import Image from "next/image";

export default function EditArticlePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const articleId = Number(params.id);
  const { articles, updateArticle } = useArticles();
  const { topics } = useTopics();

  const article = articles.find((a) => a.id === articleId);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ArticleFormData>({
    defaultValues: {
      title: article?.title || "",
      content: article?.content || "",
      topicId: article?.topicId || 0,
      xymPrice: article?.xymPrice || 0,
    },
  });

  const [markdown, setMarkdown] = useState(article?.content || "");
  const [selectedTab, setSelectedTab] = useState<"write" | "preview">("write");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const converter = new Showdown.Converter({
    tables: true,
    simplifiedAutoLink: true,
    strikethrough: true,
    asklists: true,
  });

  useEffect(() => {
    if (article) {
      setValue("title", article.title);
      setValue("content", article.content);
      setValue("topicId", article.topicId);
      setValue("xymPrice", article.xymPrice);
      setMarkdown(article.content);
      if (article.images && article.images.length > 0) {
        setUploadedImages(
          article.images.map((img: { url: string }) => img.url)
        );
      }
    }
  }, [article, setValue]);

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    const items = clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
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
            console.error("画像のアップロードに失敗しました（ペースト）");
          }
        }
      }
    }
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

  const handleDeleteImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ArticleFormData) => {
    try {
      const payload = {
        ...data,
        topicId: Number(data.topicId),
        author: article?.author,
        userId: article?.userId,
        images: uploadedImages.map((url) => ({ url })),
      };

      const res = await fetch(`/api/articles/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        updateArticle(updated);
        alert("記事が更新されました");
        router.push("/");
      } else {
        alert("記事更新に失敗しました");
      }
    } catch (error) {
      console.error("更新エラー:", error);
      alert("記事の更新中にエラーが発生しました");
    }
  };

  if (status === "loading") return <p>Loading...</p>;
  if (!session) {
    signIn();
    return null;
  }
  if (!article) return <p>記事が見つかりません。</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>記事編集</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              タイトル
            </label>
            <Input
              placeholder="タイトル"
              {...register("title", { required: true })}
              className="w-full"
            />
            {errors.title && (
              <span className="text-red-600 text-xs">タイトルは必須です</span>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              買取金額
            </label>
            <Input
              type="number"
              placeholder="買取金額"
              {...register("xymPrice", { required: true, valueAsNumber: true })}
              className="w-full"
            />
            {errors.xymPrice && (
              <span className="text-red-600 text-xs">買取金額は必須です</span>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">本文</label>
            <div className="border rounded-lg p-2">
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
            </div>
            {errors.content && (
              <span className="text-red-600 text-xs">本文は必須です</span>
            )}
          </div>
          <div className="space-y-2">
            <Button
              type="button"
              onClick={handleImageButtonClick}
              className="mb-2"
            >
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
            <div className="space-y-4">
              {uploadedImages.map((url, index) => (
                <div key={index} className="border p-2 rounded">
                  <div className="relative w-full h-80">
                    <Image
                      src={url}
                      alt={`Uploaded ${index}`}
                      fill
                      className="object-contain rounded"
                    />
                  </div>
                  <div className="mt-2">
                    <Button
                      type="button"
                      onClick={() => handleDeleteImage(index)}
                      variant="destructive"
                    >
                      削除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              トピック
            </label>
            <select
              {...register("topicId", { required: true })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">トピックを選択</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-4 mt-6">
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
            >
              戻る
            </Button>
            <Button type="submit">更新する</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
