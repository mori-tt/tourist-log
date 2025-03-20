"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ChevronDown, User } from "lucide-react";

export default function NavItems() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="flex items-center space-x-1">
      <Link
        href="/"
        className={cn(
          "px-3 py-2 rounded-md text-sm font-medium transition-colors",
          pathname === "/"
            ? "bg-primary/10 text-primary"
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        ホーム
      </Link>
      <Link
        href="/topics"
        className={cn(
          "px-3 py-2 rounded-md text-sm font-medium transition-colors",
          pathname === "/topics"
            ? "bg-primary/10 text-primary"
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        トピック
      </Link>
      <Link
        href="/#about"
        className={cn(
          "px-3 py-2 rounded-md text-sm font-medium transition-colors",
          pathname === "/about"
            ? "bg-primary/10 text-primary"
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        サイトについて
      </Link>

      <div className="border-l border-gray-300 h-6 mx-2" />

      {session ? (
        <div className="relative group">
          <button className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
            <User size={16} className="mr-1" />
            <span className="hidden md:inline">
              {session.user?.name || "ユーザー"}
            </span>
            <ChevronDown size={16} className="ml-1" />
          </button>
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-20 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-y-0 translate-y-1">
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              プロフィール
            </Link>
            <Link
              href="/dashboard"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              ダッシュボード
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
        <>
          <Link
            href="/login"
            className={cn(
              "px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === "/login"
                ? "bg-primary/10 text-primary"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            ログイン
          </Link>
          <div className="hidden lg:block">
            <Link
              href="/signin"
              className="ml-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 transition-colors"
            >
              新規登録
            </Link>
          </div>
        </>
      )}
    </nav>
  );
}
