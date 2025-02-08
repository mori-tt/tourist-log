"use client";

import { signIn } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UserSignupPage() {
  const handleUserSignUp = () => {
    // Google認証後、complete-signup ページに role=user を渡す
    signIn("google", { callbackUrl: "/auth/complete-signup?role=user" });
  };

  return (
    <Card className="m-8 p-8">
      <h1 className="text-2xl mb-4">ユーザーサインアップ</h1>
      <p>
        一般ユーザーとして登録するには、以下のボタンをクリックしてGoogle認証を行ってください。
      </p>
      <Button onClick={handleUserSignUp}>
        Googleでユーザーとしてサインアップ
      </Button>
    </Card>
  );
}
