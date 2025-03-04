"use client";

import { useSession, signIn } from "next-auth/react";
import { useTopics } from "@/context/TopicsContext";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function TopicPage() {
  const { data: session, status } = useSession();
  const { topics } = useTopics();
  const router = useRouter();
  const params = useParams();
  const topicId = Number(params.topicId);
  const topic = topics.find((t) => t.id === topicId);
  const [advertiserName, setAdvertiserName] = useState<string>("");

  useEffect(() => {
    const fetchAdvertiserName = async () => {
      if (!topic || !topic.advertiserId) {
        setAdvertiserName("不明な広告主");
        return;
      }

      try {
        const res = await fetch(`/api/user/${topic.advertiserId}`);
        if (res.ok) {
          const userData = await res.json();
          setAdvertiserName(userData.name || topic.advertiserId);
        } else {
          setAdvertiserName(topic.advertiserId);
        }
      } catch (error) {
        console.error("広告主名の取得に失敗しました:", error);
        setAdvertiserName(topic.advertiserId);
      }
    };

    fetchAdvertiserName();
  }, [topic]);

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
      {topic ? (
        <>
          <CardHeader>
            <CardTitle>{topic.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">内容:</label>
                <p>{topic.content}</p>
              </div>
              <div>
                <label className="block mb-1 font-medium">広告主:</label>
                <p>{advertiserName}</p>
              </div>
              <div>
                <label className="block mb-1 font-medium">広告料:</label>
                <p>{topic.adFee} XYM</p>
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  月間PV支払い基準:
                </label>
                <p>{topic.monthlyPVThreshold}</p>
              </div>
              <div className="flex gap-4">
                {isEditable && (
                  <Link href={`/topics/${topicId}/edit`}>
                    <Button>編集</Button>
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
                <Link href="/">
                  <Button variant="outline">戻る</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </>
      ) : (
        <p>トピックが見つかりません。</p>
      )}
    </Card>
  );
}
