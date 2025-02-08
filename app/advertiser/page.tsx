"use client";

import { useSession, signIn } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdvertiserDashboard() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  // 広告主以外の場合はサインインまたはアクセス拒否
  if (!session || !session.user.isAdvertiser) {
    signIn();
    return null;
  }

  return (
    <Card className="m-8 p-8">
      <h1 className="text-2xl mb-4">広告主ダッシュボード</h1>
      <p>ようこそ、{session.user.name || session.user.email} さん！</p>
      <div className="mt-4 flex flex-col gap-4">
        <Link href="/topics">
          <Button>トピック管理</Button>
        </Link>
        {/* ここに追加の広告主向け機能を実装できます */}
        <div className="border p-4 rounded">
          <p>
            ここに広告キャンペーンの管理や統計情報などの機能を実装可能です。
          </p>
        </div>
      </div>
    </Card>
  );
}
