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

    // ユーザー情報を取得
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`/api/user/${session.user.id}`);
        if (response.ok) {
          const userData = await response.json();

          // DBから取得したユーザー情報をセット
          const userInfoData: UserInfo = {
            id: session?.user?.id || "unknown",
            name: userData.name || session?.user?.name || "名前未設定",
            isAdmin: session?.user?.isAdmin || false,
            isAdvertiser: session?.user?.isAdvertiser || false,
            joinedAt: userData.createdAt
              ? new Date(userData.createdAt).toLocaleDateString("ja-JP")
              : "不明",
            prefecture: "東京都", // 現状のDBにはprefectureフィールドがないため固定値を使用
            interests: ["観光", "グルメ", "文化体験"], // 現状のDBにはinterestsフィールドがないため固定値を使用
            image: userData.image || session?.user?.image || undefined,
          };

          setUserInfo(userInfoData);
        } else {
          // APIからの取得に失敗した場合はセッション情報から最低限のデータを作成
          const dummyUserInfo: UserInfo = {
            id: session?.user?.id || "unknown",
            name: session?.user?.name || "名前未設定",
            isAdmin: session?.user?.isAdmin || false,
            isAdvertiser: session?.user?.isAdvertiser || false,
            joinedAt: "不明",
            prefecture: "東京都", // 固定値
            interests: ["観光", "グルメ", "文化体験"], // 固定値
            image: session?.user?.image || undefined,
          };
          setUserInfo(dummyUserInfo);
        }
      } catch (error) {
        console.error("ユーザー情報の取得に失敗しました:", error);
        // エラー時は最低限の情報をセット
        const dummyUserInfo: UserInfo = {
          id: session?.user?.id || "unknown",
          name: session?.user?.name || "名前未設定",
          isAdmin: session?.user?.isAdmin || false,
          isAdvertiser: session?.user?.isAdvertiser || false,
          joinedAt: "不明",
          prefecture: "東京都", // 固定値
          interests: ["観光", "グルメ", "文化体験"], // 固定値
          image: session?.user?.image || undefined,
        };
        setUserInfo(dummyUserInfo);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
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
    <div className="container mx-auto py-6 sm:py-10 px-4 max-w-4xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">
        プロフィール
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* プロフィールカード */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="text-center pb-2">
              {userInfo.image ? (
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-3 sm:mb-4">
                  <Image
                    src={userInfo.image}
                    alt={userInfo.name}
                    fill
                    className="rounded-full object-cover border-4 border-primary/10"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full mx-auto mb-3 sm:mb-4 bg-primary/10 flex items-center justify-center">
                  <User size={40} className="text-primary sm:hidden" />
                  <User size={50} className="text-primary hidden sm:block" />
                </div>
              )}
              <CardTitle className="text-lg sm:text-xl">
                {userInfo.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
                <div className="flex items-center text-xs sm:text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">登録日: {userInfo.joinedAt}</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm">
                  <Globe className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">
                    エリア: {userInfo.prefecture}
                  </span>
                </div>

                {(userInfo.isAdmin || userInfo.isAdvertiser) && (
                  <div className="pt-1 sm:pt-2 flex flex-wrap gap-1 sm:gap-2">
                    {userInfo.isAdmin && (
                      <div className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
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

              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
                <Link
                  href="/profile/settings"
                  className="text-xs sm:text-sm text-primary hover:text-primary/80 block text-center w-full"
                >
                  プロフィール設定
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3">
            <Link
              href="/profile/transactions"
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg p-3 sm:p-4 text-center text-xs sm:text-sm transition-colors flex flex-col items-center justify-center"
            >
              <span className="font-medium">取引履歴</span>
            </Link>
            <Link
              href="/my-articles"
              className="bg-green-50 hover:bg-green-100 text-green-600 rounded-lg p-3 sm:p-4 text-center text-xs sm:text-sm transition-colors flex flex-col items-center justify-center"
            >
              <span className="font-medium">記事管理</span>
            </Link>
          </div>
        </div>

        {/* ユーザー情報 */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl">ユーザー情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="font-medium mb-2 text-sm sm:text-base">
                    関心のあるテーマ
                  </h3>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {userInfo.interests.map((interest: string) => (
                      <div
                        key={interest}
                        className="bg-gray-100 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm"
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
            <Card className="mt-4 sm:mt-6">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">
                  あなたのコンテンツ
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {userArticles.length > 0 && (
                  <div className="mb-4 sm:mb-6">
                    <h3 className="font-medium mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                      <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
                      投稿した記事
                    </h3>
                    <div className="grid gap-1 sm:gap-2">
                      {userArticles.slice(0, 5).map((article) => (
                        <Link
                          key={article.id}
                          href={`/article/${article.id}`}
                          className="p-2 hover:bg-gray-50 rounded-md flex justify-between items-center transition-colors"
                        >
                          <div className="truncate text-xs sm:text-sm max-w-[70%]">
                            {article.title}
                          </div>
                          <div className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                            {new Date(article.updatedAt).toLocaleDateString(
                              "ja-JP"
                            )}
                          </div>
                        </Link>
                      ))}
                      {userArticles.length > 5 && (
                        <Link
                          href="/my-articles"
                          className="text-xs sm:text-sm text-primary hover:underline text-right mt-1"
                        >
                          すべての記事を表示
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {userTopics.length > 0 && userInfo.isAdvertiser && (
                  <div>
                    <h3 className="font-medium mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                      <BookOpen className="mr-2 h-4 w-4 flex-shrink-0" />
                      作成したトピック
                    </h3>
                    <div className="grid gap-1 sm:gap-2">
                      {userTopics.slice(0, 5).map((topic) => (
                        <Link
                          key={topic.id}
                          href={`/topics/${topic.id}`}
                          className="p-2 hover:bg-gray-50 rounded-md flex justify-between items-center transition-colors"
                        >
                          <div className="truncate text-xs sm:text-sm max-w-[70%]">
                            {topic.title}
                          </div>
                          <div className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                            {topic.adFee} XYM
                          </div>
                        </Link>
                      ))}
                      {userTopics.length > 5 && (
                        <Link
                          href="/my-topics"
                          className="text-xs sm:text-sm text-primary hover:underline text-right mt-1"
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
          <Card className="mt-4 sm:mt-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl">最近の活動</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground">
                活動記録はまだありません。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
