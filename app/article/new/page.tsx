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
import { ArticleFormData } from "@/types/article";
import { Controller } from "react-hook-form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Image from "next/image";

export default function NewArticlePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addArticle } = useArticles();
  const { topics } = useTopics();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    control,
  } = useForm<ArticleFormData>({
    defaultValues: {
      title: "",
      content: "",
      topicId: undefined,
      xymPrice: 0,
    },
  });

  const [markdown, setMarkdown] = useState("");
  const [selectedTab, setSelectedTab] = useState<"write" | "preview">("write");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          await uploadImage(file);
        }
      }
    }
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUploadedImages((prev) => [...prev, data.url]);
        // 画像URLをマークダウンに挿入するオプション
        // setMarkdown((prev) => `${prev}\n![画像](${data.url})\n`);
        // setValue("content", `${markdown}\n![画像](${data.url})\n`);
      } else {
        const errorData = await res.json();
        setUploadError(errorData.error || "画像のアップロードに失敗しました");
      }
    } catch (error) {
      console.error("画像アップロードエラー:", error);
      setUploadError("画像のアップロードに失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadImage(file);
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ArticleFormData) => {
    if (!session?.user?.id) {
      alert("ログインしてください");
      return;
    }

    try {
      const formData = {
        ...data,
        topicId: Number(data.topicId),
        author: session.user.email || "",
        userId: session.user.id,
        authorName:
          session.user.name ||
          session.user.email?.split("@")[0] ||
          "匿名ユーザー",
        images: uploadedImages.map((url) => ({ url })),
      };

      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const createdArticle = await res.json();
        addArticle(createdArticle);
        alert("記事が正常に投稿されました");
        router.push(`/article/${createdArticle.id}`);
      } else {
        const errorData = await res.json();
        alert(`記事の投稿に失敗しました: ${errorData.error || "不明なエラー"}`);
      }
    } catch (error) {
      console.error("投稿エラー:", error);
      alert("記事の投稿中にエラーが発生しました");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    signIn();
    return null;
  }

  if (session.user.isAdvertiser || session.user.isAdmin) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-10">
              <h2 className="text-xl font-bold mb-4">アクセス制限</h2>
              <p className="mb-6 text-muted-foreground">
                一般ユーザーのみ記事の投稿が可能です。
              </p>
              <Button onClick={() => router.push("/")}>ホームに戻る</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">新規記事作成</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-sm font-medium text-gray-700"
              >
                タイトル
              </label>
              <Input
                id="title"
                placeholder="記事タイトル"
                {...register("title", {
                  required: "タイトルは必須です",
                  maxLength: {
                    value: 100,
                    message: "タイトルは100文字以内で入力してください",
                  },
                })}
                className="w-full"
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="xymPrice"
                className="text-sm font-medium text-gray-700"
              >
                買取金額 (XYM)
              </label>
              <Input
                id="xymPrice"
                type="number"
                placeholder="買取金額"
                min="0"
                step="1"
                {...register("xymPrice", {
                  required: "買取金額は必須です",
                  min: {
                    value: 0,
                    message: "買取金額は0以上で入力してください",
                  },
                  valueAsNumber: true,
                })}
                className="w-full"
              />
              {errors.xymPrice && (
                <p className="text-red-500 text-sm">
                  {errors.xymPrice.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="content"
                className="text-sm font-medium text-gray-700"
              >
                本文
              </label>
              <div className="border rounded-lg overflow-hidden">
                <ReactMde
                  value={markdown}
                  onChange={(value) => {
                    setMarkdown(value);
                    setValue("content", value, {
                      shouldValidate: true,
                    });
                  }}
                  selectedTab={selectedTab}
                  onTabChange={setSelectedTab}
                  generateMarkdownPreview={(markdown) =>
                    Promise.resolve(converter.makeHtml(markdown))
                  }
                  childProps={{
                    textArea: {
                      id: "content",
                      onPaste: handlePaste,
                    },
                  }}
                />
              </div>
              <input
                type="hidden"
                {...register("content", {
                  required: "本文は必須です",
                  minLength: {
                    value: 10,
                    message: "本文は10文字以上で入力してください",
                  },
                })}
              />
              {errors.content && (
                <p className="text-red-500 text-sm">{errors.content.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">画像</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={handleImageButtonClick}
                  disabled={isUploading}
                  variant="outline"
                  className="flex items-center"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-primary rounded-full"></div>
                      アップロード中...
                    </>
                  ) : (
                    <>画像を追加</>
                  )}
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </div>
              {uploadError && (
                <p className="text-red-500 text-sm">{uploadError}</p>
              )}
            </div>

            {uploadedImages.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">
                  アップロード済み画像
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {uploadedImages.map((url, index) => (
                    <div
                      key={index}
                      className="border p-2 rounded relative group"
                    >
                      <div className="relative w-full h-40">
                        <Image
                          src={url}
                          alt={`アップロード画像 ${index + 1}`}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Button
                          type="button"
                          onClick={() => handleDeleteImage(index)}
                          variant="destructive"
                          size="sm"
                        >
                          削除
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                トピック
              </label>
              <Controller
                control={control}
                name="topicId"
                rules={{ required: "トピックを選択してください" }}
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
                <p className="text-red-500 text-sm">{errors.topicId.message}</p>
              )}
            </div>

            <div className="pt-4 flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                    投稿中...
                  </>
                ) : (
                  "投稿する"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
