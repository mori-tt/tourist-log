"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useTopics } from "@/context/TopicsContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TopicFormData {
  title: string;
  content: string;
  adFee: number;
  monthlyPVThreshold: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const { topics, addTopic } = useTopics();
  const { register, handleSubmit, reset } = useForm<TopicFormData>();

  if (status === "loading") {
    return <p>Loading...</p>;
  }
  if (!session) {
    signIn();
    return null;
  }

  // 広告主の場合のみトピック投稿フォームを表示する例
  const isAdvertiser = session.user?.isAdvertiser;

  const onSubmit = async (data: TopicFormData) => {
    const newTopicData = {
      title: data.title,
      content: data.content,
      adFee: data.adFee,
      monthlyPVThreshold: data.monthlyPVThreshold,
      advertiserId: session.user.email || "",
    };

    const res = await fetch("/api/topics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newTopicData),
    });
    if (res.ok) {
      const createdTopic = await res.json();
      addTopic(createdTopic);
      reset();
    } else {
      console.error("トピックの保存に失敗しました");
    }
  };

  return (
    <div className="space-y-8 p-8">
      <Card className="w-full p-4">
        <CardHeader>
          <CardTitle>Tourist Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {session.user.isAdmin && (
              <Link href="/admin">
                <Button variant="outline">管理者ダッシュボード</Button>
              </Link>
            )}
            {isAdvertiser && (
              <>
                <Link href="/advertiser">
                  <Button variant="outline">広告主ダッシュボード</Button>
                </Link>
                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle>新しいトピックを追加</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
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
                        <label className="block mb-1">広告料 (円)</label>
                        <Input
                          type="number"
                          placeholder="広告料"
                          {...register("adFee", {
                            required: true,
                            valueAsNumber: true,
                          })}
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
                      <Button type="submit">トピック投稿</Button>
                    </form>
                  </CardContent>
                </Card>
              </>
            )}
            <div>
              <h2 className="text-2xl font-bold mb-4">トピック一覧</h2>
              {topics.length === 0 ? (
                <p>トピックはまだありません。</p>
              ) : (
                <ul className="space-y-4">
                  {topics.map((topic) => (
                    <li key={topic.id} className="border rounded p-4">
                      <h3 className="text-xl font-semibold">{topic.title}</h3>
                      <p>{topic.content}</p>
                      <p>広告料: {topic.adFee} 円</p>
                      <p>月のPV支払い基準: {topic.monthlyPVThreshold}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
