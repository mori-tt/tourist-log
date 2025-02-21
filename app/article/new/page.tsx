"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTopics } from "@/context/TopicsContext";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import ReactMde from "react-mde";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkImageAttributes from "remark-image-attributes";
import "react-mde/lib/styles/css/react-mde-all.css";
import { useArticles } from "@/context/ArticlesContext";

interface ArticleFormData {
  title: string;
  content: string;
  topicId: string;
}

export default function NewArticlePage() {
  const { data: session, status } = useSession();
  const { topics } = useTopics();
  const router = useRouter();
  const { articles, addArticle } = useArticles();
  const { register, handleSubmit, setValue } = useForm<ArticleFormData>();

  const [selectedTab, setSelectedTab] = useState<"write" | "preview">("write");
  const [markdown, setMarkdown] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editorHeight, setEditorHeight] = useState(300);

  useEffect(() => {
    setEditorHeight(window.innerHeight * 0.7);
  }, []);

  // ペーストによる画像挿入処理（クリップボード画像を Base64 に変換）
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

  // ファイル選択による画像アップロード処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
  };

  // 画像追加ボタン押下時、隠しファイル入力をクリック
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
    // もし data.topicId が空の場合は送信を中断する
    if (!data.topicId) {
      alert("投稿するトピックを選択してください。");
      return;
    }

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          // topicId はそのまま送信（数値変換はAPI内で実施するか、不要なら文字列のままでOK）
          topicId: data.topicId,
          author: session.user.email,
          userId: session.user.id,
        }),
      });
      if (res.ok) {
        const createdArticle = await res.json();
        addArticle(createdArticle);
        router.refresh();
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
    <Card className="m-8 p-8">
      <CardHeader>
        <CardTitle>新規記事投稿</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-4">
          <div>
            <label className="block mb-1">記事タイトル</label>
            <Input
              {...register("title", { required: true })}
              placeholder="タイトル"
            />
          </div>
          <div>
            <label className="block mb-1">内容 (Markdown対応)</label>
            <div className="mb-2">
              <ReactMde
                value={markdown}
                onChange={(value) => {
                  setMarkdown(value);
                  setValue("content", value);
                }}
                selectedTab={selectedTab}
                onTabChange={setSelectedTab}
                // プレビュー生成で ReactMarkdown を利用。remark-gfm, remark-image-attributes により
                // 画像に対し幅や高さ、配置などの属性が指定可能となります。
                generateMarkdownPreview={(markdown) =>
                  Promise.resolve(
                    <ReactMarkdown
                      children={markdown}
                      remarkPlugins={[remarkGfm, remarkImageAttributes]}
                    />
                  )
                }
                childProps={{
                  textArea: { onPaste: handlePaste },
                }}
              />
            </div>
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
          <div>
            <label className="block mb-1">投稿するトピック</label>
            <select
              {...register("topicId", { required: true })}
              className="border p-2 w-full"
              defaultValue=""
            >
              <option value="">トピックを選択</option>
              {topics.map((topic) => (
                <option key={topic.id} value={String(topic.id)}>
                  {topic.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Button type="submit">投稿する</Button>
          </div>
        </form>
        <Link href="/">
          <Button variant="outline">戻る</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
