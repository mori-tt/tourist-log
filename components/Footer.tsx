import React from "react";
import Link from "next/link";
import { Compass, Mail, MapPin, Globe } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ロゴとサイト説明 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Compass className="text-primary" size={24} />
              <Link href="/" className="text-xl font-bold text-foreground">
                Tourist <span className="text-primary">Log</span>
              </Link>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              地元の地方クリエイターが造る観光情報プラットフォーム。
              広告主と地方クリエイターを繋ぎ、魅力的な観光コンテンツを提供します。
            </p>
          </div>

          {/* ナビゲーション */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">
              ナビゲーション
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-primary text-sm transition-colors"
                >
                  ホーム
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-primary text-sm transition-colors"
                >
                  サインアップ・ログイン
                </Link>
              </li>
            </ul>
          </div>

          {/* お問い合わせ */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">お問い合わせ</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail size={16} />
                <span className="text-sm">info@touristlog.com</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <MapPin size={16} />
                <span className="text-sm">日本国内各地</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Globe size={16} />
                <span className="text-sm">全国対応</span>
              </div>
            </div>
            <div className="flex space-x-4 mt-4">
              <span className="text-muted-foreground text-sm">
                SNS近日公開予定
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {currentYear} Tourist Log. All rights reserved.</p>
          <p className="mt-1">
            地方の隠れた魅力を、地元クリエイターの視点で発信するプラットフォーム
          </p>
        </div>
      </div>
    </footer>
  );
}
