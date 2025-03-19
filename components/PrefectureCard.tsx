import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Prefecture, prefectures } from "@/lib/data/prefectures";

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

// 都道府県コードから都道府県を取得
function getPrefectureByCode(code: string): Prefecture | undefined {
  return prefectures.find((prefecture: Prefecture) => prefecture.code === code);
}

interface PrefectureCardProps {
  prefecture: Prefecture;
  className?: string;
}

export function PrefectureCard({
  prefecture,
  className = "",
}: PrefectureCardProps) {
  const { emoji, gradient } = getPrefectureEmoji(prefecture.code);

  return (
    <Link
      href={`/prefecture/${prefecture.code}`}
      className="block transition-transform duration-300 hover:scale-105"
    >
      <Card className={`overflow-hidden hover:shadow-lg ${className}`}>
        <div className={`relative aspect-video bg-gradient-to-br ${gradient}`}>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl" role="img" aria-label={prefecture.name}>
              {emoji}
            </span>
            <span className="mt-2 text-lg font-medium text-white drop-shadow-md">
              {prefecture.name}
            </span>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium text-lg">{prefecture.name}</h3>
          <p className="text-muted-foreground text-sm">{prefecture.region}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
