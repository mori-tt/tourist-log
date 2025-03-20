"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { User, Calendar, Globe, BookOpen, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTopics } from "@/context/TopicsContext";
import { useArticles } from "@/context/ArticlesContext";
import Link from "next/link";
import Image from "next/image";

// ユーザー情報の型定義
interface UserInfo {
  id: string;
  name: string;
  isAdmin: boolean;
  isAdvertiser: boolean;
  joinedAt: string;
  prefecture: string;
  interests: string[];
  image?: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const { topics } = useTopics();
  const { articles } = useArticles();

  // このユーザーが関連するトピックと記事をフィルタリング
  const userTopics = topics.filter(
    (topic) => session?.user?.id && topic.advertiserId === session.user.id
  );
  const userArticles = articles.filter(
    (article) => session?.user?.id && article.userId === session.user.id
  );

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      redirect("/login");
    }

    // 仮のユーザー情報を作成
    const dummyUserInfo: UserInfo = {
      id: session?.user?.id || "unknown",
      name: session?.user?.name || "名前未設定",
      isAdmin: session?.user?.isAdmin || false,
      isAdvertiser: session?.user?.isAdvertiser || false,
      joinedAt: "2023年1月1日",
      prefecture: "東京都",
      interests: ["観光", "グルメ", "文化体験"],
    };

    setUserInfo(dummyUserInfo);
    setIsLoading(false);
  }, [session, status]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userInfo) {
    return <div>ユーザー情報が見つかりません</div>;
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">プロフィール</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* プロフィールカード */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="text-center pb-2">
              {userInfo.image ? (
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <Image
                    src={userInfo.image}
                    alt={userInfo.name}
                    fill
                    className="rounded-full object-cover border-4 border-primary/10"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-primary/10 flex items-center justify-center">
                  <User size={50} className="text-primary" />
                </div>
              )}
              <CardTitle className="text-xl">{userInfo.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-4">
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>登録日: {userInfo.joinedAt}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>エリア: {userInfo.prefecture}</span>
                </div>

                {(userInfo.isAdmin || userInfo.isAdvertiser) && (
                  <div className="pt-2">
                    {userInfo.isAdmin && (
                      <div className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                        管理者
                      </div>
                    )}
                    {userInfo.isAdvertiser && (
                      <div className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        広告主
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ユーザー情報 */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>ユーザー情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">関心のあるテーマ</h3>
                  <div className="flex flex-wrap gap-2">
                    {userInfo.interests.map((interest: string) => (
                      <div
                        key={interest}
                        className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                      >
                        {interest}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />
              </div>
            </CardContent>
          </Card>

          {/* ユーザーのコンテンツ */}
          {(userArticles.length > 0 || userTopics.length > 0) && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>あなたのコンテンツ</CardTitle>
              </CardHeader>
              <CardContent>
                {userArticles.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-medium mb-3 flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      投稿した記事
                    </h3>
                    <div className="grid gap-2">
                      {userArticles.slice(0, 5).map((article) => (
                        <Link
                          key={article.id}
                          href={`/article/${article.id}`}
                          className="p-2 hover:bg-gray-50 rounded-md flex justify-between items-center transition-colors"
                        >
                          <div className="truncate">{article.title}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(article.updatedAt).toLocaleDateString(
                              "ja-JP"
                            )}
                          </div>
                        </Link>
                      ))}
                      {userArticles.length > 5 && (
                        <Link
                          href="/my-articles"
                          className="text-sm text-primary hover:underline text-right mt-1"
                        >
                          すべての記事を表示
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {userTopics.length > 0 && userInfo.isAdvertiser && (
                  <div>
                    <h3 className="font-medium mb-3 flex items-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      作成したトピック
                    </h3>
                    <div className="grid gap-2">
                      {userTopics.slice(0, 5).map((topic) => (
                        <Link
                          key={topic.id}
                          href={`/topics/${topic.id}`}
                          className="p-2 hover:bg-gray-50 rounded-md flex justify-between items-center transition-colors"
                        >
                          <div className="truncate">{topic.title}</div>
                          <div className="text-xs text-gray-500">
                            {topic.adFee} XYM
                          </div>
                        </Link>
                      ))}
                      {userTopics.length > 5 && (
                        <Link
                          href="/my-topics"
                          className="text-sm text-primary hover:underline text-right mt-1"
                        >
                          すべてのトピックを表示
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 最近の活動（オプション） */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>最近の活動</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                活動記録はまだありません。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
