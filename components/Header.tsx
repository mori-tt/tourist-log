"use client";

import React, { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Search, Compass } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import NavItems from "@/components/NavItems";

export default function Header() {
  useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const status = useSession().status;
  const session = useSession().data;

  // スクロール時のヘッダー変化を処理
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 検索機能の実装
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
      setIsOpen(false);
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled ? "bg-white shadow-md" : "bg-white/80 backdrop-blur-md"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col">
          {/* Top row: Logo, navigation for desktop and menu button for mobile */}
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-1">
                <Compass className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-primary">
                  Tourist<span className="text-blue-400">Log</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation - moved to top row */}
            <div className="hidden md:block">
              <NavItems />
            </div>

            {/* モバイルのみメニューボタンを表示 */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex flex-col items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary focus:outline-none"
              >
                {isOpen ? (
                  <>
                    <X className="h-6 w-6" />
                    <span className="text-xs">閉じる</span>
                  </>
                ) : (
                  <>
                    <Menu className="h-6 w-6" />
                    <span className="text-xs">メニュー</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bottom row: Search bar only */}
          <div className="hidden md:block border-t border-gray-200 py-2">
            <div className="flex items-center justify-center">
              <form
                onSubmit={handleSearch}
                className="relative w-full max-w-md"
              >
                <div className="flex items-center border border-gray-300 rounded-full overflow-hidden pl-3 pr-1 py-1 focus-within:ring-2 focus-within:ring-primary/50 bg-gray-50 hover:bg-white transition-colors">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="トピックや記事を検索..."
                    className="bg-transparent outline-none w-full text-sm"
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-primary text-white hover:bg-primary/90"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-2">
          <div className="px-4 pt-2 pb-4 space-y-4">
            {/* モバイル検索バー */}
            <form onSubmit={handleSearch} className="relative mb-4">
              <div className="flex items-center border border-gray-300 rounded-full overflow-hidden pl-3 pr-1 py-1 focus-within:ring-2 focus-within:ring-primary/50 bg-gray-50">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="トピックや記事を検索..."
                  className="bg-transparent outline-none w-full text-sm"
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-primary text-white hover:bg-primary/90"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>

            <div className="grid grid-cols-1 gap-2">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium text-center",
                  pathname === "/"
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                ホーム
              </Link>
              <Link
                href="/topics"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium text-center",
                  pathname === "/topics"
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                トピック
              </Link>
              <Link
                href="/#about"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium text-center",
                  pathname === "/about"
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                About
              </Link>

              {!session?.user?.isAdmin && session?.user && (
                <Link
                  href="/profile/transactions"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block px-3 py-2 rounded-md text-base font-medium text-center",
                    pathname === "/profile/transactions"
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  MY XYM取引履歴
                </Link>
              )}

              {session?.user?.isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block px-3 py-2 rounded-md text-base font-medium text-center",
                    pathname === "/admin"
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  管理者ダッシュボード
                </Link>
              )}

              {!status || status === "unauthenticated" ? (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "block px-3 py-2 rounded-md text-base font-medium text-center",
                      "bg-primary text-white hover:bg-primary/90"
                    )}
                  >
                    ログイン / 新規登録
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "block px-3 py-2 rounded-md text-base font-medium text-center",
                      pathname === "/profile"
                        ? "bg-primary/10 text-primary"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    プロフィール
                  </Link>

                  {!session?.user?.isAdmin && (
                    <Link
                      href="/profile/settings"
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "block px-3 py-2 rounded-md text-base font-medium text-center",
                        "bg-blue-50 text-blue-600 border border-blue-200"
                      )}
                    >
                      Symbolアドレス登録・更新
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      signOut();
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-2 mt-2 rounded-md text-base font-medium text-center text-gray-700 hover:bg-gray-100"
                  >
                    ログアウト
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
