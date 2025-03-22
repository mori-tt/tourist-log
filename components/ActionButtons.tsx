"use client";

import { Session } from "next-auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  session: Session | null;
  className?: string;
}

export function ActionButtons({ session, className = "" }: ActionButtonsProps) {
  return (
    <>
      {!session && (
        <div className={`flex flex-wrap justify-center gap-4 ${className}`}>
          <Link href="/login">
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-base h-auto"
            >
              サインアップ・ログイン
            </Button>
          </Link>
          <Link href="/topics">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-6 text-base h-auto"
            >
              トピック一覧
            </Button>
          </Link>
        </div>
      )}
      {session && (
        <div className={`flex flex-wrap justify-center gap-4 ${className}`}>
          {session.user?.isAdvertiser ? (
            <Link href="/topics/new">
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-base h-auto bg-green-600 hover:bg-green-700"
              >
                トピック投稿
              </Button>
            </Link>
          ) : session.user?.isAdmin ? null : (
            <Link href="/article/new">
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-base h-auto bg-blue-600 hover:bg-blue-700"
              >
                記事投稿
              </Button>
            </Link>
          )}
          <Link href="/topics">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-6 text-base h-auto"
            >
              トピック一覧
            </Button>
          </Link>

          {session?.user && !session.user.isAdmin && (
            <Link href="/profile/settings">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 py-6 text-base h-auto bg-blue-50 text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                Symbolアドレス登録・更新
              </Button>
            </Link>
          )}
        </div>
      )}
    </>
  );
}
