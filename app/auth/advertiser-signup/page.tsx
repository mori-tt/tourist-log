"use client";

import { signIn } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdvertiserSignupPage() {
  const handleAdvertiserSignUp = () => {
    // Googleサインイン後、広告主ダッシュボードへリダイレクト
    signIn("google", { callbackUrl: "/advertiser" });
  };

  return (
    <Card className="m-8 p-8">
      <h1 className="text-2xl mb-4">広告主サインアップ</h1>
      <p>
        広告主として登録するには、以下のボタンをクリックしてGoogle認証を行ってください。
      </p>
      <Button onClick={handleAdvertiserSignUp}>
        Googleで広告主としてサインアップ
      </Button>
    </Card>
  );
}
