"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTopics } from "@/context/TopicsContext";
import { useArticles } from "@/context/ArticlesContext";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { getPrefectureByCode } from "@/lib/data/prefectures";
import {
  MapPin,
  Info,
  Calendar,
  Star,
  Users,
  TrendingUp,
  Edit,
  Shield,
  Gift,
  CreditCard,
  Eye,
} from "lucide-react";

// PrefectureCardから絵文字と背景色の取得関数をインポート
// 都道府県ごとに異なる背景色と絵文字を設定
function getPrefectureEmoji(code: string): { emoji: string; gradient: string } {
  // 地方別にグラデーションカラーを変える
  const regionGradients: Record<string, string> = {
    北海道: "from-blue-500 to-blue-200",
    東北: "from-green-600 to-green-200",
    関東: "from-purple-500 to-purple-200",
    中部: "from-yellow-600 to-yellow-200",
    関西: "from-red-500 to-red-200",
    中国: "from-indigo-500 to-indigo-200",
    四国: "from-teal-500 to-teal-200",
    九州沖縄: "from-orange-500 to-orange-200",
  };

  // 都道府県ごとに異なる絵文字を割り当て
  const prefectureEmojis: Record<string, string> = {
    // 北海道
    hokkaido: "🏔️",
    // 東北
    aomori: "🍎",
    iwate: "🏯",
    miyagi: "🐂",
    akita: "🐶",
    yamagata: "🍒",
    fukushima: "🍑",
    // 関東
    tokyo: "🗼",
    kanagawa: "🚢",
    saitama: "🏮",
    chiba: "🏝️",
    ibaraki: "🥬",
    tochigi: "🍓",
    gunma: "🏔️",
    // 中部
    niigata: "🍚",
    toyama: "🏔️",
    ishikawa: "🍚",
    fukui: "🦖",
    yamanashi: "🍇",
    nagano: "🍎",
    gifu: "🏮",
    shizuoka: "🗻",
    aichi: "🏯",
    // 関西
    mie: "🦞",
    shiga: "🚣",
    kyoto: "⛩️",
    osaka: "🏙️",
    hyogo: "🌉",
    nara: "🦌",
    wakayama: "🍊",
    // 中国
    tottori: "🏜️",
    shimane: "⛩️",
    okayama: "🍑",
    hiroshima: "🏯",
    yamaguchi: "🐟",
    // 四国
    tokushima: "🌊",
    kagawa: "🍜",
    ehime: "🍊",
    kochi: "🐟",
    // 九州沖縄
    fukuoka: "🍲",
    saga: "🍵",
    nagasaki: "🚢",
    kumamoto: "🐻",
    oita: "♨️",
    miyazaki: "🏄",
    kagoshima: "🌋",
    okinawa: "🌺",
  };

  const defaultEmoji = "📍";
  const defaultGradient = "from-gray-500 to-gray-300";

  return {
    emoji: prefectureEmojis[code] || defaultEmoji,
    gradient: code
      ? regionGradients[getPrefectureRegion(code)] || defaultGradient
      : defaultGradient,
  };
}

// コードから地方を取得する補助関数
function getPrefectureRegion(code: string): string {
  const prefectureObj = getPrefectureByCode(code);
  return prefectureObj?.region || "";
}

// ユーザーロールの判定を明確にするためのカスタムフック
function useUserRole() {
  const { data: session } = useSession();

  return {
    isLoggedIn: !!session?.user,
    isAdmin: !!session?.user?.isAdmin,
    isAdvertiser: !!session?.user?.isAdvertiser,
    isCreator:
      !!session?.user && !session.user.isAdmin && !session.user.isAdvertiser,
    userId: session?.user?.id,
  };
}

export default function PrefecturePage() {
  const params = useParams();
  const prefectureCode = params.prefectureCode as string;
  const prefecture = getPrefectureByCode(prefectureCode);

  const { data: session, status } = useSession();
  const { topics } = useTopics();
  const { articles } = useArticles();
  const [authorNames, setAuthorNames] = useState<{ [key: string]: string }>({});
  const [advertiserNames, setAdvertiserNames] = useState<{
    [key: string]: string;
  }>({});
  const [articleTips, setArticleTips] = useState<{ [key: number]: number }>({});

  // ユーザーロールを取得
  const userRole = useUserRole();

  // ユーザー名を非同期に取得する関数
  const fetchUserName = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        return userData.name || "名前未設定";
      }
    } catch (error) {
      console.error("ユーザー名の取得に失敗しました:", error);
    }
    return "不明なユーザー";
  };

  // 記事のチップ（投げ銭）情報を取得する関数
  const fetchArticleTips = async () => {
    try {
      const res = await fetch("/api/tips/summary");
      if (res.ok) {
        const data = await res.json();
        const tipsMap: { [key: number]: number } = {};
        data.forEach((item: { articleId: number; totalTips: number }) => {
          tipsMap[item.articleId] = item.totalTips;
        });
        setArticleTips(tipsMap);
      }
    } catch (error) {
      console.error("投げ銭情報の取得に失敗しました:", error);
    }
  };

  // 記事の著者名とトピックの広告主名を取得
  useEffect(() => {
    const getAuthorNames = async () => {
      const nameMap: { [key: string]: string } = {};
      for (const article of articles) {
        if (article.userId && !nameMap[article.userId]) {
          nameMap[article.userId] = await fetchUserName(article.userId);
        }
      }
      setAuthorNames(nameMap);
    };

    const getAdvertiserNames = async () => {
      const nameMap: { [key: string]: string } = {};
      for (const topic of topics) {
        if (topic.advertiserId && !nameMap[topic.advertiserId]) {
          nameMap[topic.advertiserId] = await fetchUserName(topic.advertiserId);
        }
      }
      setAdvertiserNames(nameMap);
    };

    getAuthorNames();
    getAdvertiserNames();
    fetchArticleTips();
  }, [articles, topics]);

  if (status === "loading") return <p>Loading...</p>;
  if (!prefecture) return <p>都道府県が見つかりません</p>;

  // この都道府県に関連するトピックをフィルタリング
  const filteredTopics = topics.filter((topic) => {
    // タイトルまたは内容に都道府県名が含まれているかをチェック
    const prefectureName = prefecture.name;
    const prefectureNameWithoutSuffix = prefectureName.replace(
      /[都道府県]$/,
      ""
    );
    return (
      topic.title.includes(prefectureName) ||
      topic.title.includes(prefectureNameWithoutSuffix) ||
      topic.content.includes(prefectureName) ||
      topic.content.includes(prefectureNameWithoutSuffix)
    );
  });

  // 都道府県の絵文字とグラデーションを取得
  const { emoji, gradient } = getPrefectureEmoji(prefectureCode);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* 都道府県ヘッダー - AirBnb風に改良 */}
      <section className="mb-8">
        <div
          className={`relative rounded-xl overflow-hidden bg-gradient-to-r ${gradient} mb-6`}
        >
          <div className="absolute inset-0 opacity-20 pattern-dots pattern-white pattern-size-4 pattern-diagonal-lines"></div>
          <div className="px-6 py-10 sm:py-16 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-white p-4 rounded-full shadow-md mr-6">
                <span
                  className="text-6xl"
                  role="img"
                  aria-label={prefecture.name}
                >
                  {emoji}
                </span>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-md">
                  {prefecture.name}
                </h1>
                <div className="flex items-center mt-2 text-white">
                  <MapPin size={16} className="mr-1" />
                  <p className="text-lg font-medium">{prefecture.region}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ユーザーロールアイコンパネル - ユーザータイプ別に表示機能を視覚化 */}
        {userRole.isLoggedIn && (
          <div className="px-4 py-2 bg-white rounded-lg shadow-sm mb-4 border-l-4 border-primary">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">あなたは:</span>
              {userRole.isAdmin && (
                <div className="flex items-center px-2 py-1 bg-red-100 text-red-700 rounded">
                  <Shield className="h-3 w-3 mr-1" />
                  <span>管理者</span>
                </div>
              )}
              {userRole.isAdvertiser && (
                <div className="flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded">
                  <CreditCard className="h-3 w-3 mr-1" />
                  <span>広告主</span>
                </div>
              )}
              {userRole.isCreator && (
                <div className="flex items-center px-2 py-1 bg-green-100 text-green-700 rounded">
                  <Edit className="h-3 w-3 mr-1" />
                  <span>クリエイター</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AirBnb風の特徴アイコン */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2 py-4 bg-white rounded-lg shadow-sm mb-6">
          <div className="flex flex-col items-center text-center p-2">
            <Calendar className="h-6 w-6 text-primary mb-2" />
            <span className="text-sm font-medium">地元の季節イベント</span>
          </div>
          <div className="flex flex-col items-center text-center p-2">
            <Star className="h-6 w-6 text-primary mb-2" />
            <span className="text-sm font-medium">観光スポット</span>
          </div>
          <div className="flex flex-col items-center text-center p-2">
            <Users className="h-6 w-6 text-primary mb-2" />
            <span className="text-sm font-medium">地元クリエイター</span>
          </div>
          <div className="flex flex-col items-center text-center p-2">
            <TrendingUp className="h-6 w-6 text-primary mb-2" />
            <span className="text-sm font-medium">人気の記事</span>
          </div>
        </div>
      </section>

      {/* トピック一覧 - AirBnb風のカードデザイン */}
      <section className="mb-12">
        <div className="flex items-center mb-6">
          <h2 className="text-2xl font-bold">
            {prefecture.name}のトピック一覧
          </h2>
          <div className="ml-auto">
            {userRole.isAdvertiser && (
              <Link href="/topics/new">
                <Button variant="outline" size="sm">
                  <Info className="h-4 w-4 mr-1" />
                  トピックを作成
                </Button>
              </Link>
            )}
          </div>
        </div>

        {filteredTopics.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-xl text-muted-foreground mb-4">
              まだトピックはありません
            </p>
            {userRole.isAdvertiser && (
              <Link href="/topics/new">
                <Button>{prefecture.name}のトピックを作成する</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {filteredTopics
              .sort((a, b) => b.id - a.id)
              .map((topic) => (
                <Card
                  key={topic.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <CardHeader
                    className={`bg-gradient-to-r ${gradient} bg-opacity-10 border-b`}
                  >
                    <CardTitle className="flex items-center text-lg md:text-xl justify-between">
                      <div className="flex items-center">
                        <span className="mr-2">{emoji}</span>
                        {topic.title}
                      </div>
                      {userRole.isAdmin && (
                        <Link href={`/admin/topic/${topic.id}`}>
                          <Button variant="outline" size="sm" className="ml-2">
                            <Shield className="h-3 w-3 mr-1" />
                            管理
                          </Button>
                        </Link>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                          {topic.content}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                            <div>
                              <span className="text-xs text-gray-400">
                                広告主
                              </span>
                              <p className="font-medium truncate">
                                {advertiserNames[topic.advertiserId] ||
                                  "不明な広告主"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                            <Star className="h-4 w-4 mr-2 text-gray-400" />
                            <div>
                              <span className="text-xs text-gray-400">
                                広告料
                              </span>
                              <p className="font-medium">{topic.adFee} XYM</p>
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                            <TrendingUp className="h-4 w-4 mr-2 text-gray-400" />
                            <div>
                              <span className="text-xs text-gray-400">
                                PV基準
                              </span>
                              <p className="font-medium">
                                {topic.monthlyPVThreshold}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end mb-6">
                          <Link href={`/topics/${topic.id}`}>
                            <Button variant="outline" size="sm">
                              トピック詳細
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {/* このトピックに関連する記事 */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center">
                          <Info className="h-4 w-4 mr-2" />
                          関連記事
                        </h3>
                        {articles
                          .filter((article) => article.topicId === topic.id)
                          .filter((article) => {
                            // 未ログインの場合は未購入の記事のみ表示
                            if (!session) return !article.isPurchased;

                            // 購入済み記事のアクセス制御
                            if (!article.isPurchased) {
                              // 未購入記事は誰でも閲覧可能
                              return true;
                            }
                            // 購入済み記事は投稿者、購入者、管理者のみ閲覧可能
                            return (
                              userRole.isAdmin ||
                              article.userId === session.user.id ||
                              article.purchasedBy === session.user.id
                            );
                          })
                          .sort(
                            (a, b) =>
                              new Date(b.updatedAt).getTime() -
                              new Date(a.updatedAt).getTime()
                          ).length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {articles
                              .filter((article) => article.topicId === topic.id)
                              .filter((article) => {
                                // 未ログインの場合は未購入の記事のみ表示
                                if (!session) return !article.isPurchased;

                                // 購入済み記事のアクセス制御
                                if (!article.isPurchased) {
                                  // 未購入記事は誰でも閲覧可能
                                  return true;
                                }
                                // 購入済み記事は投稿者、購入者、管理者のみ閲覧可能
                                return (
                                  userRole.isAdmin ||
                                  article.userId === session.user.id ||
                                  article.purchasedBy === session.user.id
                                );
                              })
                              .sort(
                                (a, b) =>
                                  new Date(b.updatedAt).getTime() -
                                  new Date(a.updatedAt).getTime()
                              )
                              .map((article) => (
                                <Card
                                  key={article.id}
                                  className="flex flex-col h-full hover:shadow-md transition-shadow border border-gray-100"
                                >
                                  <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-base font-medium flex items-center">
                                      <span className="mr-2 text-sm">
                                        {emoji}
                                      </span>
                                      {article.title}
                                      {article.isPurchased && (
                                        <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                          購入済み
                                        </span>
                                      )}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-4 pt-0 flex-grow">
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600">
                                      <ReactMarkdown>
                                        {article.content.slice(0, 80) + "..."}
                                      </ReactMarkdown>
                                    </div>

                                    {/* ブロックチェーン情報と統計バッジ - 可視化強化 */}
                                    <div className="mt-4 flex flex-wrap gap-2 mb-3">
                                      {/* PV数バッジ */}
                                      <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full flex items-center">
                                        <Eye className="h-3 w-3 mr-1" />
                                        {article.views} PV
                                      </div>

                                      {/* 投げ銭バッジ */}
                                      <div className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full flex items-center">
                                        <Gift className="h-3 w-3 mr-1" />
                                        {articleTips[article.id] || 0} XYM
                                      </div>

                                      {/* 価格バッジ */}
                                      <div className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full flex items-center">
                                        <CreditCard className="h-3 w-3 mr-1" />
                                        {article.xymPrice} XYM
                                      </div>
                                    </div>

                                    <div className="mt-2 space-y-1 text-xs text-gray-500">
                                      <p className="flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {article.updatedAt.split("T")[0]}
                                      </p>
                                      <p className="flex items-center">
                                        <Users className="h-3 w-3 mr-1" />
                                        {authorNames[article.userId] ||
                                          "不明なユーザー"}
                                      </p>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                      <Link href={`/article/${article.id}`}>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="hover:bg-primary hover:text-white transition-colors"
                                        >
                                          記事を読む
                                        </Button>
                                      </Link>

                                      {/* 管理者編集ボタン */}
                                      {userRole.isAdmin && (
                                        <Link
                                          href={`/admin/article/${article.id}`}
                                        >
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="hover:bg-red-100"
                                          >
                                            <Shield className="h-3 w-3 mr-1" />
                                            管理
                                          </Button>
                                        </Link>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-xl">
                            <p className="text-muted-foreground mb-4">
                              このトピックの記事はまだありません
                            </p>
                            {userRole.isLoggedIn && (
                              <div>
                                <Link href={`/article/new`}>
                                  <Button variant="outline" size="sm">
                                    記事を投稿する
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </section>

      {/* 観光情報 - AirBnb風に改良 */}
      <section className="bg-card p-6 sm:p-8 rounded-xl shadow-sm">
        <div className="flex items-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full mr-4">
            <Info className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{prefecture.name}について</h2>
        </div>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          {prefecture.name}
          の観光情報、特色ある文化や歴史、グルメ情報などを地元のクリエイターが発信します。
          地元ならではの視点で、観光ガイドには載っていない隠れた魅力をご紹介します。
        </p>

        {/* ブロックチェーン機能の説明パネル */}
        {userRole.isLoggedIn && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">ブロックチェーン機能</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start p-3 bg-white rounded shadow-sm">
                <Gift className="h-10 w-10 p-2 bg-green-100 text-green-600 rounded-lg mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium">投げ銭機能</p>
                  <p className="text-gray-600">
                    クリエイターに直接XYMで支援できます
                  </p>
                </div>
              </div>
              <div className="flex items-start p-3 bg-white rounded shadow-sm">
                <CreditCard className="h-10 w-10 p-2 bg-purple-100 text-purple-600 rounded-lg mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium">記事買取機能</p>
                  <p className="text-gray-600">
                    価値ある記事をXYMで購入して所有権を得られます
                  </p>
                </div>
              </div>
              <div className="flex items-start p-3 bg-white rounded shadow-sm">
                <TrendingUp className="h-10 w-10 p-2 bg-blue-100 text-blue-600 rounded-lg mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium">PV連動広告料</p>
                  <p className="text-gray-600">
                    閲覧数に応じた広告収入がクリエイターに入ります
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {userRole.isLoggedIn && (
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/article/new">
              <Button className="rounded-full px-6">
                <span className="mr-2">{emoji}</span>
                {prefecture.name}の記事を投稿する
              </Button>
            </Link>
            {userRole.isAdvertiser && (
              <Link href="/topics/new">
                <Button variant="outline" className="rounded-full px-6">
                  <Info className="h-4 w-4 mr-2" />
                  {prefecture.name}のトピックを作成する
                </Button>
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
