"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TopicsPage from "@/app/topics/page";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 管理者の場合はダッシュボードへリダイレクト
  useEffect(() => {
    if (status === "authenticated" && session?.user?.isAdmin) {
      router.push("/admin");
    }
  }, [status, session, router]);

  if (status === "loading") return <p>Loading...</p>;

  if (!session) {
    return (
      <Card className="m-8 p-8 flex flex-col items-center gap-4">
        <CardHeader>
          <CardTitle className="text-3xl mb-4">Welcome</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link href="/auth/user-signup">
            <Button>ユーザーサインアップ</Button>
          </Link>
          <Link href="/auth/advertiser-signup">
            <Button>広告主サインアップ</Button>
          </Link>
          <Button onClick={() => signIn("google")}>ログイン</Button>
        </CardContent>
      </Card>
    );
  }

  // ログイン済みかつ一般ユーザーの場合は、トピック一覧画面を表示
  return <TopicsPage />;
}
