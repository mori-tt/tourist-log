"use client";

import React, { useState, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ReactMde from "react-mde";
import "react-mde/lib/styles/css/react-mde-all.css";
import Showdown from "showdown";
import { useArticles } from "@/context/ArticlesContext";
import { useTopics } from "@/context/TopicsContext";
import SafeImage from "@/components/SafeImage";
import { ArticleFormData } from "@/types/article";
import { Controller } from "react-hook-form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function NewArticlePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addArticle } = useArticles();
  const { topics } = useTopics();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    control,
  } = useForm<ArticleFormData>();
  const [markdown, setMarkdown] = useState("");
  const [selectedTab, setSelectedTab] = useState<"write" | "preview">("write");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const converter = new Showdown.Converter({
    tables: true,
    simplifiedAutoLink: true,
    strikethrough: true,
    asklists: true,
  });

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

  const onSubmit = async (data: ArticleFormData) => {
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          topicId: Number(data.topicId),
          author: session?.user?.email || "",
          userId: session?.user?.id || "",
          authorName: session?.user?.email
            ? session.user.email.split("@")[0]
            : "",
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

  if (status === "loading") return <p>Loading...</p>;
  if (!session) {
    signIn();
    return null;
  }
  if (session.user.isAdvertiser || session.user.isAdmin) {
    return <p>一般ユーザーのみ記事の投稿が可能です。</p>;
  }

  return (
    <Card className="m-8 p-8">
      <CardHeader>
        <CardTitle>新規記事作成</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {uploadedImages.map((url, index) => (
                <div key={index} className="relative w-full h-40">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              トピック
            </label>
            <Controller
              control={control}
              name="topicId"
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(value: string) => field.onChange(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="トピックを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={String(topic.id)}>
                        {topic.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.topicId && (
              <p className="text-red-500 text-sm">トピックを選択してください</p>
            )}
          </div>
          <Button type="submit">投稿する</Button>
        </form>
      </CardContent>
    </Card>
  );
}
