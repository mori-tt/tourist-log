"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import ReactMde from "react-mde";
import * as Showdown from "showdown";
import "react-mde/lib/styles/css/react-mde-all.css";

interface ArticleFormData {
  title: string;
  content: string;
  images: FileList;
}

export default function ArticleForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ArticleFormData>();

  const [selectedTab, setSelectedTab] = useState<"write" | "preview">("write");
  const [markdown, setMarkdown] = useState("");

  const converter = new Showdown.Converter({
    tables: true,
    simplifiedAutoLink: true,
    strikethrough: true,
    tasklists: true,
  });

  const onSubmit = (data: ArticleFormData) => {
    if (markdown.length < 5000) {
      alert("記事内容は最低5000文字必要です。");
      return;
    }
    if (data.images.length < 10) {
      alert("画像は10枚以上必要です。");
      return;
    }
    // react-hook-form によるバリデーションのうえ、markdown の内容を content にセット
    data.content = markdown;
    console.log(data);
    // バックエンドへの送信処理等をここで実装
  };

  return (
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
          minEditorHeight={500}
        />
        {errors.content && (
          <span className="text-red-500">{errors.content.message}</span>
        )}
      </div>

      <div>
        <Input
          type="file"
          multiple
          {...register("images", { required: "画像は必須です。" })}
        />
        {errors.images && (
          <span className="text-red-500">{errors.images.message}</span>
        )}
      </div>

      <Button type="submit">投稿する</Button>
    </form>
  );
}
