"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CompleteSignupForm({ role }: { role: string }) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 送信済みフラグで二重レンダリングを防ぐ
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const res = await fetch("/api/auth/complete-signup", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role }),
    });

    if (res.ok) {
      setSubmitted(true);
      router.replace(role === "advertiser" ? "/advertiser" : "/");
    } else {
      console.error("サインアップ完了に失敗しました");
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return null; // 送信後はフォーム表示を防ぐ
  }

  return (
    <Card className="m-8 p-8">
      <CardHeader>
        <CardTitle>サインアップ完了</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label>
            お名前:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-2"
              required
            />
          </label>
          <Button type="submit">登録を完了する</Button>
        </form>
      </CardContent>
    </Card>
  );
}
