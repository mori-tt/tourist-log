"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import ReactMde from "react-mde";
import * as Showdown from "showdown";
import "react-mde/lib/styles/css/react-mde-all.css";

interface TopicFormData {
  title: string;
  content: string;
  images: FileList;
  adFee: number;
  monthlyPVThreshold: number;
}

export default function TopicForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<TopicFormData>();

  const [selectedTab, setSelectedTab] = useState<"write" | "preview">("write");
  const [markdown, setMarkdown] = useState("");

  const converter = new Showdown.Converter({
    tables: true,
    simplifiedAutoLink: true,
    strikethrough: true,
    tasklists: true,
  });

  const onSubmit = async (data: TopicFormData) => {
    // 内容が5000文字以上であるかチェック
    if (markdown.length < 5000) {
      alert("トピック内容は最低5000文字必要です。");
      return;
    }
    // 画像は例として10枚以上必須とする
    if (data.images.length < 10) {
      alert("画像は10枚以上必要です。");
      return;
    }
    data.content = markdown;

    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          adFee: data.adFee,
          monthlyPVThreshold: data.monthlyPVThreshold,
          // 実際はセッション情報から advertiserId を取得してください
          advertiserId: "dummy-advertiser@example.com",
          // 画像アップロードの処理は別途実装（例: Cloud Storage）
        }),
      });
      if (res.ok) {
        alert("トピックが正常に作成されました。");
        reset();
        setMarkdown("");
      } else {
        alert("トピック作成に失敗しました。");
      }
    } catch (error) {
      console.error("トピック作成エラー:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          placeholder="トピックタイトル"
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

      <div>
        <Input
          type="number"
          placeholder="広告料 (円)"
          {...register("adFee", {
            required: "広告料は必須です。",
            valueAsNumber: true,
          })}
        />
      </div>

      <div>
        <Input
          type="number"
          placeholder="月間PV支払い基準"
          {...register("monthlyPVThreshold", {
            required: "月間PV支払い基準は必須です。",
            valueAsNumber: true,
          })}
        />
      </div>

      <Button type="submit">トピックを作成</Button>
    </form>
  );
}
