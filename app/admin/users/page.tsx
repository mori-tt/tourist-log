"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminUsersPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session || !session.user.isAdmin) {
    signIn();
    return null;
  }

  return (
    <Card className="m-8 p-8">
      <h1 className="text-2xl mb-4">ユーザー管理</h1>
      <p>ユーザー管理機能はここで実装してください。</p>
      <Link href="/admin/users/list">
        <Button variant="outline">ユーザー一覧</Button>
      </Link>
    </Card>
  );
}
