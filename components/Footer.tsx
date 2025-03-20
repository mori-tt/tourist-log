"use client";

import React from "react";
import Link from "next/link";
import { Instagram, ChevronUp, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

// 日本の地方と都道府県コードを定義
const regions = [
  {
    name: "北海道",
    prefectures: [{ code: "hokkaido", name: "北海道" }],
  },
  {
    name: "東北",
    prefectures: [
      { code: "aomori", name: "青森県" },
      { code: "iwate", name: "岩手県" },
      { code: "miyagi", name: "宮城県" },
      { code: "akita", name: "秋田県" },
      { code: "yamagata", name: "山形県" },
      { code: "fukushima", name: "福島県" },
    ],
  },
  {
    name: "関東",
    prefectures: [
      { code: "ibaraki", name: "茨城県" },
      { code: "tochigi", name: "栃木県" },
      { code: "gunma", name: "群馬県" },
      { code: "saitama", name: "埼玉県" },
      { code: "chiba", name: "千葉県" },
      { code: "tokyo", name: "東京都" },
      { code: "kanagawa", name: "神奈川県" },
    ],
  },
  {
    name: "中部",
    prefectures: [
      { code: "niigata", name: "新潟県" },
      { code: "toyama", name: "富山県" },
      { code: "ishikawa", name: "石川県" },
      { code: "fukui", name: "福井県" },
      { code: "yamanashi", name: "山梨県" },
      { code: "nagano", name: "長野県" },
      { code: "gifu", name: "岐阜県" },
      { code: "shizuoka", name: "静岡県" },
      { code: "aichi", name: "愛知県" },
    ],
  },
  {
    name: "関西",
    prefectures: [
      { code: "mie", name: "三重県" },
      { code: "shiga", name: "滋賀県" },
      { code: "kyoto", name: "京都府" },
      { code: "osaka", name: "大阪府" },
      { code: "hyogo", name: "兵庫県" },
      { code: "nara", name: "奈良県" },
      { code: "wakayama", name: "和歌山県" },
    ],
  },
  {
    name: "中国",
    prefectures: [
      { code: "tottori", name: "鳥取県" },
      { code: "shimane", name: "島根県" },
      { code: "okayama", name: "岡山県" },
      { code: "hiroshima", name: "広島県" },
      { code: "yamaguchi", name: "山口県" },
    ],
  },
  {
    name: "四国",
    prefectures: [
      { code: "tokushima", name: "徳島県" },
      { code: "kagawa", name: "香川県" },
      { code: "ehime", name: "愛媛県" },
      { code: "kochi", name: "高知県" },
    ],
  },
  {
    name: "九州・沖縄",
    prefectures: [
      { code: "fukuoka", name: "福岡県" },
      { code: "saga", name: "佐賀県" },
      { code: "nagasaki", name: "長崎県" },
      { code: "kumamoto", name: "熊本県" },
      { code: "oita", name: "大分県" },
      { code: "miyazaki", name: "宮崎県" },
      { code: "kagoshima", name: "鹿児島県" },
      { code: "okinawa", name: "沖縄県" },
    ],
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // ページ上部へスクロールする関数
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      {/* ページ上部へ戻るボタン */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="py-3 flex justify-center">
            <button
              onClick={scrollToTop}
              className="group flex items-center space-x-2 text-sm text-gray-600 hover:text-primary transition-colors"
            >
              <ChevronUp className="h-5 w-5 group-hover:animate-bounce" />
              <span>ページ上部へ</span>
            </button>
          </div>
        </div>
      </div>

      {/* メインフッター */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* サイト情報 */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2">
              <Compass className="h-6 w-6 text-blue-400" />
              <span className="font-bold text-xl text-primary">
                Tourist<span className="text-blue-400">Log</span>
              </span>
            </Link>
            <p className="text-sm text-gray-600 mb-4">
              日本の地方や都道府県に関する情報や記事を提供するプラットフォームです。
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* 地方リスト */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              日本の地方から探す
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {regions.map((region) => (
                <div key={region.name} className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 text-center sm:text-left">
                    {region.name}
                  </h4>
                  <ul className="space-y-1">
                    {region.prefectures.map((pref) => (
                      <li key={pref.code} className="text-center sm:text-left">
                        <Link
                          href={`/prefecture/${pref.code}`}
                          className="text-xs text-gray-600 hover:text-primary hover:underline transition-colors"
                        >
                          {pref.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* サポート・お問い合わせ */}
          <div className="md:col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              サポート
            </h3>
            <ul className="space-y-2 mb-6">
              <li>
                <Link
                  href="/#about"
                  className="text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  サイトについて
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  利用規約
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  プライバシーポリシー
                </Link>
              </li>
            </ul>
            <Button className="w-full rounded-full">お問い合わせ</Button>
          </div>
        </div>
      </div>

      {/* コピーライト */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="py-4 text-center text-xs text-gray-500">
            &copy; {currentYear} TouristLog. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
