"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 認証済みの場合はホームページへリダイレクト
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") return <p>Loading...</p>;

  if (!session) {
    return (
      <Card className="m-8 p-8 flex flex-col items-center gap-4">
        <CardHeader>
          <CardTitle className="text-3xl mb-4">Sign up or Login</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link href="/auth/user-signup">
            <Button>ユーザーサインアップ</Button>
          </Link>
          <Link href="/auth/advertiser-signup">
            <Button>広告主サインアップ</Button>
          </Link>
          <Button onClick={() => signIn("google")}>ログイン</Button>
          <Link href="/">
            <Button variant="outline">トップページへ</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return null;
}
