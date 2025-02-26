"use client";

import { useForm } from "react-hook-form";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTopics } from "@/context/TopicsContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TopicFormData {
  title: string;
  content: string;
  adFee: number;
  monthlyPVThreshold: number;
}

export default function TopicPostPage() {
  const { data: session, status } = useSession();
  const { addTopic } = useTopics();
  const { register, handleSubmit, reset } = useForm<TopicFormData>();
  const router = useRouter();

  if (status === "loading") return <p>Loading...</p>;
  if (!session || !(session.user.isAdvertiser || session.user.isAdmin)) {
    signIn();
    return null;
  }

  const onSubmit = async (data: TopicFormData) => {
    const newTopicData = {
      title: data.title,
      content: data.content,
      adFee: data.adFee,
      monthlyPVThreshold: data.monthlyPVThreshold,
      advertiserId: session.user.id || "",
    };

    const res = await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTopicData),
    });
    if (res.ok) {
      const createdTopic = await res.json();
      addTopic(createdTopic); // クライアント側の Context に追加
      reset();
      router.push("/"); // 登録後、初期画面に遷移
    } else {
      console.error("トピックの保存に失敗しました");
    }
  };

  return (
    <Card className="m-8 p-8">
      <CardHeader>
        <CardTitle>新しいトピックの投稿</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1">タイトル</label>
            <Input
              placeholder="トピックのタイトル"
              {...register("title", { required: true })}
            />
          </div>
          <div>
            <label className="block mb-1">内容</label>
            <Textarea
              placeholder="トピックの内容"
              {...register("content", { required: true })}
            />
          </div>
          <div>
            <label className="block mb-1">広告料 (XYM)</label>
            <Input
              type="number"
              placeholder="広告料"
              {...register("adFee", { required: true, valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="block mb-1">月のPV支払い基準</label>
            <Input
              type="number"
              placeholder="月のPV支払い基準"
              {...register("monthlyPVThreshold", {
                required: true,
                valueAsNumber: true,
              })}
            />
          </div>
          <Button type="submit">トピックを投稿</Button>
        </form>
      </CardContent>
      <div className="mt-4">
        <Link href="/">
          <Button variant="outline">ホームへ</Button>
        </Link>
      </div>
    </Card>
  );
}
