"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import ReactMde from "react-mde";
import * as Showdown from "showdown";
import "react-mde/lib/styles/css/react-mde-all.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { useArticles } from "@/context/ArticlesContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";

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

  const router = useRouter();
  const params = useParams();
  const topicId = Number(params.topicId);
  const { articles } = useArticles();
  const { data: session } = useSession();

  useEffect(() => {
    setEditorHeight(window.innerHeight * 0.7);
  }, []);

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          topicId,
          author: session?.user?.email,
        }),
      });
      if (res.ok) {
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

  const filteredArticles = articles.filter(
    (article) => article.topicId === topicId
  );

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
