"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import WalletAddressAlert from "@/components/WalletAddressAlert";
import {
  getPrefecturesByRegion,
  getRegions,
  Prefecture,
} from "@/lib/data/prefectures";
import { PrefectureCard } from "@/components/PrefectureCard";
import { HeartHandshake, Map, Sparkles, Compass, Users } from "lucide-react";
import { Session } from "next-auth";
import { ActionButtons } from "@/components/ActionButtons";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prefecturesByRegion, setPrefecturesByRegion] = useState<
    Record<string, Prefecture[]>
  >({});
  const [regions, setRegions] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // セッション情報を取得
        const response = await fetch("/api/auth/session");
        const data = await response.json();
        setSession(data);

        // 地域データを取得
        const prefectures = getPrefecturesByRegion();
        const regionData = getRegions();

        setPrefecturesByRegion(prefectures);
        setRegions(regionData);
      } catch (error) {
        console.error("データ取得エラー:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* ウォレットアドレス警告表示 (ログイン時のみ) */}
      {session && <WalletAddressAlert />}

      {/* ヒーローセクション */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Compass className="text-blue-400 h-10 w-10 md:h-12 md:w-12 mr-2" />
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-primary">
                Tourist<span className="text-blue-400">Log</span>
              </h1>
            </div>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
              日本全国の隠れた魅力を、地元クリエイターの視点で発見しよう
            </p>
          </div>
          <ActionButtons session={session} />
        </div>
      </section>

      {/* 地方別の都道府県一覧 */}
      <section className="py-12 px-4 space-y-12">
        {regions.map((region) => (
          <div key={region} className="mb-8">
            <h2 className="text-2xl font-bold mb-6 border-b pb-2">{region}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {prefecturesByRegion[region].map((prefecture) => (
                <PrefectureCard key={prefecture.id} prefecture={prefecture} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Tourist Logについて */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl mb-4 font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-primary">
              Tourist<span className="text-blue-400">Log</span> について
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              地元の視点から日本の魅力を再発見する、次世代の観光プラットフォーム
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Map className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">
                  地元クリエイターの視点
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  地元をよく知る地方クリエイターが、ユニークな視点で観光情報を発信。
                  観光ガイドには載っていない隠れた名所や体験を発見できます。
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <HeartHandshake className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">記事の買取・投げ銭</h3>
                <p className="text-muted-foreground leading-relaxed">
                  ブロックチェーン技術を活用した記事買取機能や投げ銭機能で、クリエイターへ直接支援。
                  価値ある情報に適切に対価を支払うエコシステムを実現します。
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">
                  広告主と地方の地元クリエイターの橋渡し
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  広告主が作ってほしい記事のトピックを立て、地方の地元クリエイターが記事を作成。
                  クリエイターは、記事購入や投げ銭で直接支援を受けられる
                </p>
              </div>
            </div>
          </div>

          {/* 特徴セクション */}
          <div className="mt-16 grid md:grid-cols-2 gap-10">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <Compass className="h-6 w-6 mr-3 text-primary" />
                旅行者にとってのメリット
              </h3>
              <ul className="space-y-4">
                <li className="flex">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <span className="text-primary font-medium">1</span>
                  </span>
                  <p className="text-muted-foreground">
                    地元の人しか知らない隠れた名所や体験を発見できる
                  </p>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <span className="text-primary font-medium">2</span>
                  </span>
                  <p className="text-muted-foreground">
                    都道府県ごとに最新の観光情報にアクセス可能
                  </p>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <span className="text-primary font-medium">3</span>
                  </span>
                  <p className="text-muted-foreground">
                    ユーザーは、旅の前に地元の人より有益な情報を得られる
                  </p>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <Users className="h-6 w-6 mr-3 text-primary" />
                クリエイターにとってのメリット
              </h3>
              <ul className="space-y-4">
                <li className="flex">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <span className="text-primary font-medium">1</span>
                  </span>
                  <p className="text-muted-foreground">
                    地元の魅力を発信することで収益化が可能
                  </p>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <span className="text-primary font-medium">2</span>
                  </span>
                  <p className="text-muted-foreground">
                    記事の購入や投げ銭で直接支援を受けられる
                  </p>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <span className="text-primary font-medium">3</span>
                  </span>
                  <p className="text-muted-foreground">
                    地域活性化に貢献しながら自分のスキルを活かせる
                  </p>
                </li>
              </ul>
            </div>
          </div>

          {/* CTAセクション */}
          <div className="mt-20 text-center">
            <Link href={session ? "/topics" : "/login"}>
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-base h-auto"
              >
                {session ? "トピックを見る" : "今すぐ始める"}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
