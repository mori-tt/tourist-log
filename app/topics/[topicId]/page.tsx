"use client";

import { useSession } from "next-auth/react";
import { useTopics } from "@/context/TopicsContext";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useArticles } from "@/context/ArticlesContext";
import {
  User,
  Calendar,
  Edit,
  Trash,
  ArrowLeft,
  Info,
  Globe,
} from "lucide-react";
import { Article } from "@/types/article";
import ReactMarkdown from "react-markdown";

export default function TopicPage() {
  const { data: session, status } = useSession();
  const { topics } = useTopics();
  const { articles } = useArticles();
  const router = useRouter();
  const params = useParams();
  const topicId = Number(params.topicId);
  const topic = topics.find((t) => t.id === topicId);
  const [advertiserName, setAdvertiserName] = useState<string>("");
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [authorNames, setAuthorNames] = useState<{ [key: string]: string }>({});

  // 広告主名を取得
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

  // 記事を取得
  useEffect(() => {
    if (topic) {
      const filtered = articles.filter(
        (article) => article.topicId === topic.id
      );
      setRelatedArticles(filtered);

      // 著者名を取得
      const getAuthorNames = async () => {
        const nameMap: { [key: string]: string } = {};
        for (const article of filtered) {
          if (article.userId && !nameMap[article.userId]) {
            try {
              const res = await fetch(`/api/user/${article.userId}`);
              if (res.ok) {
                const userData = await res.json();
                nameMap[article.userId] = userData.name || "不明なユーザー";
              } else {
                nameMap[article.userId] = "不明なユーザー";
              }
            } catch (error) {
              console.error("著者名の取得に失敗しました:", error);
              nameMap[article.userId] = "不明なユーザー";
            }
          }
        }
        setAuthorNames(nameMap);
      };

      getAuthorNames();
    }
  }, [topic, articles]);

  // 編集可能か判定：広告主本人のみ編集を許可
  const isEditable =
    session?.user?.isAdvertiser &&
    topic &&
    session.user.id === topic.advertiserId;

  //管理者と投稿した広告主のみ削除できる
  const isDeletable =
    session?.user?.isAdmin || session?.user?.id === topic?.advertiserId;

  const handleDelete = async () => {
    if (
      confirm(
        "このトピックを削除してもよろしいですか？関連する記事も削除される可能性があります。"
      )
    ) {
      const res = await fetch(`/api/topics/${topicId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/");
      } else {
        console.error("トピック削除に失敗しました");
      }
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="bg-card shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-4">
              トピックが見つかりません
            </h2>
            <p className="text-muted-foreground mb-8">
              お探しのトピックは削除されたか、存在しない可能性があります。
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                ホームに戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // トピック情報のレンダリング
  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>ホームに戻る</span>
        </Link>
      </div>

      <Card className="bg-card shadow-sm rounded-xl overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 sm:p-8 border-b">
          <h1 className="text-2xl sm:text-3xl font-bold">{topic.title}</h1>
          <div className="flex items-center mt-4 text-sm text-muted-foreground">
            <User className="h-4 w-4 mr-1" />
            <span>広告主: {advertiserName}</span>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8">
          <div className="prose prose-sm sm:prose max-w-none">
            <div className="mb-8 whitespace-pre-wrap">
              <ReactMarkdown>{topic.content}</ReactMarkdown>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center bg-muted/50 p-4 rounded-lg">
              <Globe className="h-5 w-5 text-primary mr-3" />
              <div>
                <p className="text-xs text-muted-foreground">更新日</p>
                <p className="font-medium">
                  {new Date(topic.updatedAt).toLocaleDateString("ja-JP")}
                </p>
              </div>
            </div>
          </div>

          {/* 編集・削除ボタン */}
          {(isEditable || isDeletable) && (
            <div className="flex flex-wrap gap-4 mt-6">
              {isEditable && (
                <Link href={`/topics/${topicId}/edit`}>
                  <Button variant="outline" className="flex items-center">
                    <Edit className="h-4 w-4 mr-2" />
                    編集する
                  </Button>
                </Link>
              )}
              {isDeletable && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex items-center"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  削除する
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 記事セクション */}

      <Card className="bg-card shadow-sm rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
          <h2 className="text-xl font-bold flex items-center">
            <Info className="h-5 w-5 mr-2" />
            記事
          </h2>
        </div>
        <CardContent className="p-6">
          {relatedArticles.length > 0 ? (
            <div className="space-y-6">
              {relatedArticles.map((article) => {
                const authorName =
                  authorNames[article.userId] || "不明なユーザー";
                // Determine if the article can be viewed
                const canView = article.isPurchased
                  ? session?.user?.isAdmin ||
                    session?.user?.id === topic?.advertiserId ||
                    session?.user?.id === article.userId
                  : true;
                if (!canView) return null;

                return (
                  <div
                    key={article.id}
                    className="border-b pb-6 last:border-0 last:pb-0"
                  >
                    <Link
                      href={`/article/${article.id}`}
                      className="block hover:bg-gray-50 rounded-lg transition-colors p-3 -m-3"
                    >
                      <h3 className="text-lg font-medium mb-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <User className="h-3 w-3 mr-1" />
                        <span className="mr-3">{authorName}</span>
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                          {new Date(article.updatedAt).toLocaleDateString(
                            "ja-JP"
                          )}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-2 prose prose-sm">
                        <ReactMarkdown>
                          {article.content.substring(0, 150)}
                        </ReactMarkdown>
                      </div>
                    </Link>

                    {/* Delete button conditions */}
                    {article.isPurchased
                      ? (session?.user?.isAdmin ||
                          session?.user?.id === article.purchasedBy) && (
                          <div className="mt-3 flex justify-end">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex items-center"
                              onClick={async (e) => {
                                e.preventDefault();
                                if (
                                  confirm(
                                    "この記事を削除してもよろしいですか？"
                                  )
                                ) {
                                  const res = await fetch(
                                    `/api/articles/${article.id}`,
                                    {
                                      method: "DELETE",
                                    }
                                  );
                                  if (res.ok) {
                                    alert("記事が削除されました");
                                    router.refresh();
                                  } else {
                                    alert("記事の削除に失敗しました");
                                  }
                                }
                              }}
                            >
                              <Trash className="h-3 w-3 mr-1" />
                              削除
                            </Button>
                          </div>
                        )
                      : (session?.user?.isAdmin ||
                          session?.user?.id === topic?.advertiserId) && (
                          <div className="mt-3 flex justify-end">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex items-center"
                              onClick={async (e) => {
                                e.preventDefault();
                                if (
                                  confirm(
                                    "この記事を削除してもよろしいですか？"
                                  )
                                ) {
                                  const res = await fetch(
                                    `/api/articles/${article.id}`,
                                    {
                                      method: "DELETE",
                                    }
                                  );
                                  if (res.ok) {
                                    alert("記事が削除されました");
                                    router.refresh();
                                  } else {
                                    alert("記事の削除に失敗しました");
                                  }
                                }
                              }}
                            >
                              <Trash className="h-3 w-3 mr-1" />
                              削除
                            </Button>
                          </div>
                        )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                このトピックに関する記事はまだありません
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
