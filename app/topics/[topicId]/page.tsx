"use client";

import { useSession, signIn } from "next-auth/react";
import { useTopics } from "@/context/TopicsContext";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TopicFormData {
  title: string;
  content: string;
  adFee: number;
  monthlyPVThreshold: number;
}

export default function TopicPage() {
  const { data: session, status } = useSession();
  const { topics, updateTopic } = useTopics();
  const router = useRouter();
  const params = useParams();
  const topicId = Number(params.topicId);
  const topic = topics.find((t) => t.id === topicId);
  const { handleSubmit, setValue } = useForm<TopicFormData>();

  useEffect(() => {
    if (topic) {
      setValue("title", topic.title);
      setValue("content", topic.content);
      setValue("adFee", topic.adFee);
      setValue("monthlyPVThreshold", topic.monthlyPVThreshold);
    }
  }, [topic, setValue]);

  if (status === "loading") return <p>Loading...</p>;
  if (!session) {
    signIn();
    return null;
  }

  // 編集可能か判定：広告主本人のみ編集を許可
  const isEditable =
    session.user.isAdvertiser &&
    topic &&
    session.user.id === topic.advertiserId;

  //管理者と投稿した広告主のみ削除できる
  const isDeletable =
    session.user.isAdmin || session.user.id === topic?.advertiserId;

  const onSubmit = async (data: TopicFormData) => {
    const res = await fetch(`/api/topics/${topicId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updatedTopic = await res.json();
      updateTopic(updatedTopic);
      router.push("/dashboard"); // 更新後は共通ダッシュボードへ戻る
    } else {
      console.error("トピック更新に失敗しました");
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/topics/${topicId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/dashboard");
    } else {
      console.error("トピック削除に失敗しました");
    }
  };

  return (
    <Card className="m-8 p-8">
      <CardHeader>
        <CardTitle></CardTitle>
      </CardHeader>
      <CardContent>
        {topic ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
              <label className="block mb-1">タイトル:</label>

              <p>{topic.title}</p>
            </div>
            <div className="mb-4">
              <label className="block mb-1">内容:</label>

              <p>{topic.content}</p>
            </div>
            <div className="mb-4">
              <label className="block mb-1">広告料:</label>

              <p>{topic.adFee} 円</p>
            </div>
            <div className="mb-4">
              <label className="block mb-1">月間PV支払い基準:</label>

              <p>{topic.monthlyPVThreshold}</p>
            </div>
            <div className="mb-4 flex gap-4">
              {isEditable && (
                <Link href={`/topics/${topicId}/edit`}>
                  <Button type="submit">編集</Button>
                </Link>
              )}
              {isDeletable && (
                <Button
                  type="button"
                  onClick={handleDelete}
                  variant="destructive"
                >
                  削除
                </Button>
              )}
            </div>
            <Link href="/">
              <Button variant="outline">戻る</Button>
            </Link>
          </form>
        ) : (
          <p>トピックが見つかりません。</p>
        )}
      </CardContent>
    </Card>
  );
}
