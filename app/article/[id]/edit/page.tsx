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
      purchaseAmount: article?.purchaseAmount || 0,
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
      setValue("purchaseAmount", article.purchaseAmount);
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
          <div>
            <Input
              placeholder="タイトル"
              {...register("title", { required: true })}
            />
            {errors.title && <span>タイトルは必須です</span>}
          </div>
          <div>
            <Input
              type="number"
              placeholder="買取金額"
              {...register("purchaseAmount", {
                required: true,
                valueAsNumber: true,
              })}
            />
            {errors.purchaseAmount && <span>買取金額は必須です</span>}
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
            <div>
              {uploadedImages.map((url, index) => (
                <div key={index}>
                  <Image
                    src={url}
                    alt={`Uploaded ${index}`}
                    style={{ maxWidth: "200px" }}
                  />
                  <Button
                    type="button"
                    onClick={() => handleDeleteImage(index)}
                  >
                    削除
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div>
            <label>トピック</label>
            <select {...register("topicId", { required: true })}>
              <option value="">トピックを選択</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit">更新する</Button>
        </form>
      </CardContent>
    </Card>
  );
}
