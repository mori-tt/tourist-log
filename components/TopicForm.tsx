"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { Input } from "./ui/input";
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
  const { data: session } = useSession();
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
    if (!session?.user) {
      alert("ユーザーが認証されていません。");
      return;
    }

    if (markdown.length < 20) {
      alert("トピック内容は最低20文字必要です。");
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
          advertiserId: session.user.id,
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
      alert("トピック作成エラーが発生しました");
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
        <Input type="file" multiple {...register("images")} />
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
