"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CompleteSignupForm({ role }: { role: string }) {
  const [name, setName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletError, setWalletError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 送信済みフラグで二重レンダリングを防ぐ
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  // ウォレットアドレスのバリデーション
  const validateWalletAddress = (address: string): boolean => {
    if (!address) return true; // 空は許可
    return /^[A-Z0-9]{6}(-[A-Z0-9]{6}){5,6}$/.test(address);
  };

  const handleWalletChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setWalletAddress(address);

    if (address && !validateWalletAddress(address)) {
      setWalletError("正しいSymbolウォレットアドレス形式で入力してください");
    } else {
      setWalletError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // 入力チェック
    if (!name.trim()) {
      return;
    }

    // ウォレットアドレスが入力されている場合はバリデーション
    if (walletAddress && !validateWalletAddress(walletAddress)) {
      setWalletError("正しいSymbolウォレットアドレス形式で入力してください");
      return;
    }

    setIsSubmitting(true);

    const res = await fetch("/api/auth/complete-signup", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        role,
        walletAddress: walletAddress || null,
      }),
    });

    if (res.ok) {
      setSubmitted(true);
      router.replace("/dashboard");
    } else {
      console.error("サインアップ完了に失敗しました");
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return null; // 送信後はフォーム表示を防ぐ
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>サインアップ完了</CardTitle>
        <CardDescription>
          {role === "advertiser" ? "広告主" : "クリエイター"}
          アカウントを作成します
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">お名前 *</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="あなたの名前を入力してください"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="walletAddress">
              Symbol ウォレットアドレス (オプション)
            </Label>
            <Input
              id="walletAddress"
              type="text"
              value={walletAddress}
              onChange={handleWalletChange}
              placeholder="例: NCGGLVO-TMKGCN-NBND2F-RDOFRF-3QFPSG-BAGIPH-NPZ"
              className="font-mono"
            />
            {walletError && (
              <p className="text-xs text-red-500">{walletError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              XYMトークンの受け取りに必要です。後からプロフィール設定でも設定できます。
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !!walletError}
          >
            {isSubmitting ? "登録中..." : "登録を完了する"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
