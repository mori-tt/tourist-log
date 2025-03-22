"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ChevronDown, User } from "lucide-react";

export default function NavItems() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // ナビゲーションリンク（モバイルと同じ内容に）
  const navLinks = [
    { href: "/", label: "ホーム" },
    { href: "/topics", label: "トピック" },
    { href: "/#about", label: "About" },
    { href: "/profile/transactions", label: "MY XYM取引履歴" },
  ];

  // 追加の管理者リンク
  if (session?.user?.isAdmin) {
    navLinks.push({ href: "/admin", label: "管理者ダッシュボード" });
  }

  // 追加の広告主リンク
  if (session?.user?.isAdvertiser) {
    navLinks.push({ href: "/advertiser", label: "広告主ダッシュボード" });
  }

  return (
    <nav className="flex-1 flex items-center justify-end">
      <div className="flex flex-wrap gap-2 items-center w-full max-w-[800px] justify-end">
        {/* ナビゲーションリンク - 基本は横並び、画面幅が狭いと折り返し */}
        <div className="flex flex-wrap gap-2">
          {navLinks.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* ユーザーメニュー/ログインボタン */}
        <div className="ml-2">
          {session ? (
            <div className="relative group">
              <button className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <User size={16} className="mr-1" />
                <span>{session.user?.name || "ユーザー"}</span>
                <ChevronDown size={16} className="ml-1" />
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-20 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-y-0 translate-y-1">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  プロフィール
                </Link>
                {session?.user?.isAdmin && (
                  <Link
                    href="/admin/users"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    ユーザー管理
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  ログアウト
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="block px-4 py-2 rounded-md text-sm font-medium transition-colors border border-primary bg-primary text-white hover:bg-primary/90"
            >
              ログイン / 新規登録
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
