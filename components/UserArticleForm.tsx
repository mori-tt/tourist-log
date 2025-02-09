"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import ReactMde from "react-mde";
import * as Showdown from "showdown";
import "react-mde/lib/styles/css/react-mde-all.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { useArticles } from "@/context/ArticlesContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface ArticleFormData {
  title: string;
  content: string;
}

export default function UserArticleForm() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ArticleFormData>();
  const [selectedTab, setSelectedTab] = useState<"write" | "preview">("write");
  const [markdown, setMarkdown] = useState("");
  const [editorHeight, setEditorHeight] = useState(300);
  const params = useParams();
  const topicId = Number(params.topicId);
  const { articles } = useArticles();

  // マウント時にエディタの高さを画面の70%に設定
  useEffect(() => {
    setEditorHeight(window.innerHeight * 0.7);
  }, []);

  const converter = new Showdown.Converter({
    tables: true,
    simplifiedAutoLink: true,
    strikethrough: true,
    tasklists: true,
  });

  // 画像がクリップボードからペーストされた場合、画像を base64 化して挿入する
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

  const onSubmit = (data: ArticleFormData) => {
    console.log("投稿する記事データ:", data);
    // ここに API コールなど、バックエンドへの送信処理を実装する
  };

  // 現在のトピックIDとフィルタ結果を確認
  console.log("current topicId:", topicId);
  const filteredArticles = articles.filter(
    (article) => article.topicId === topicId
  );
  console.log("filteredArticles:", filteredArticles);

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
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <div className="mt-4">
        <Link href={`/topics/${topicId}/articles/new`}>
          <Button>新規記事を作成</Button>
        </Link>
      </div>
    </Card>
  );
}
