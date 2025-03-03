"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { isValidSymbolAddress } from "@/utils/symbolValidation";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [walletAddress, setWalletAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isValidAddress, setIsValidAddress] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      // ユーザーのウォレットアドレスを取得
      fetchWalletAddress();
    }
  }, [session]);

  // ウォレットアドレスを取得する関数
  const fetchWalletAddress = async () => {
    try {
      const res = await fetch(`/api/user/${session?.user?.id}`);
      if (res.ok) {
        const userData = await res.json();
        setWalletAddress(userData.walletAddress || "");
      } else {
        console.error("Failed to fetch wallet address");
      }
    } catch (error) {
      console.error("Error fetching wallet address:", error);
    }
  };

  // ウォレットアドレスを検証する関数
  const validateAddress = (address: string) => {
    if (!address) {
      setIsValidAddress(true);
      return;
    }
    const isValid = isValidSymbolAddress(address);
    setIsValidAddress(isValid);
    return isValid;
  };

  // ウォレットアドレスを更新する関数
  const updateWalletAddress = async () => {
    setError("");
    setSuccess("");

    // 入力がない場合は早期リターン
    if (!walletAddress) {
      setError("ウォレットアドレスを入力してください");
      return;
    }

    // 検証する
    if (!validateAddress(walletAddress)) {
      setError("有効なSymbolアドレスではありません");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/user/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session?.user?.id,
          walletAddress,
        }),
      });

      if (res.ok) {
        setSuccess("ウォレットアドレスが正常に更新されました");
        // セッション情報を更新（必要に応じて）
        await update();
      } else {
        const data = await res.json();
        setError(data.error || "ウォレットアドレスの更新に失敗しました");
      }
    } catch (error) {
      console.error("Error updating wallet address:", error);
      setError("ウォレットアドレスの更新中にエラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return <p className="p-8">Loading...</p>;
  }

  if (!session) {
    signIn();
    return null;
  }

  return (
    <div className="p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>プロフィール設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="name">名前</Label>
            <Input id="name" value={session.user?.name || ""} disabled />
          </div>

          <div>
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" value={session.user?.email || ""} disabled />
          </div>

          <div>
            <Label htmlFor="walletAddress" className="mb-1 block">
              Symbolウォレットアドレス
              <span className="text-sm text-muted-foreground ml-2">
                (投げ銭や記事購入、広告費の支払いに必要です)
              </span>
            </Label>
            <Input
              id="walletAddress"
              value={walletAddress}
              onChange={(e) => {
                const value = e.target.value;
                setWalletAddress(value);
                validateAddress(value);
              }}
              placeholder="あなたのSymbolウォレットアドレスを入力"
              className={!isValidAddress ? "border-red-500" : ""}
            />

            {!isValidAddress && (
              <div className="flex items-center text-red-500 text-sm mt-1">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>有効なSymbolアドレスではありません</span>
              </div>
            )}

            {error && (
              <div className="flex items-center text-red-500 text-sm mt-2">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center text-green-500 text-sm mt-2">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                <span>{success}</span>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              注意:
              Symbolウォレットアドレスは投げ銭の受け取りや記事購入、広告費の支払いに使用されます。
              正確なアドレスを入力してください。
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={updateWalletAddress}
            disabled={isSubmitting || !isValidAddress}
          >
            {isSubmitting ? "更新中..." : "ウォレットアドレスを保存"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
