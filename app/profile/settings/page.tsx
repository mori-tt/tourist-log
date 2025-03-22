"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

export default function ProfileSettings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [walletAddress, setWalletAddress] = useState("");
  const [originalWalletAddress, setOriginalWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // 認証チェック
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // プロフィール情報を取得
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (status !== "authenticated") return;

      try {
        setLoading(true);
        const response = await fetch(`/api/user/${session.user.id}`);
        if (!response.ok) throw new Error("Failed to fetch user profile");

        const userData = await response.json();
        if (userData.walletAddress) {
          setWalletAddress(userData.walletAddress);
          setOriginalWalletAddress(userData.walletAddress);
        }
      } catch (error) {
        console.error("プロフィール取得エラー:", error);
        toast({
          title: "エラー",
          description: "プロフィール情報の取得に失敗しました",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchUserProfile();
    }
  }, [session, status, toast]);

  // ウォレットアドレスのバリデーション
  const validateWalletAddress = (address: string): boolean => {
    // Symbolアドレスの簡易バリデーション（XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXX 形式）
    if (!address) return true; // 空は許可
    return /^[A-Z0-9]{6}(-[A-Z0-9]{6}){5,6}$/.test(address);
  };

  // ウォレットアドレス更新処理
  const handleUpdateWalletAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    // 変更がない場合は何もしない
    if (walletAddress === originalWalletAddress) {
      toast({
        title: "変更なし",
        description: "ウォレットアドレスに変更はありません",
      });
      return;
    }

    // バリデーション
    if (walletAddress && !validateWalletAddress(walletAddress)) {
      toast({
        title: "入力エラー",
        description: "正しいSymbolウォレットアドレス形式で入力してください",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaveLoading(true);
      const response = await fetch("/api/user/wallet/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "更新に失敗しました");
      }

      setOriginalWalletAddress(walletAddress);
      toast({
        title: "更新完了",
        description: "ウォレットアドレスを更新しました",
      });
    } catch (error) {
      console.error("ウォレット更新エラー:", error);
      toast({
        title: "エラー",
        description:
          error instanceof Error ? error.message : "更新に失敗しました",
        variant: "destructive",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">プロフィール設定</h1>
      <p className="text-gray-500 mb-6">アカウント情報やウォレット設定の管理</p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Symbol ウォレットアドレス</CardTitle>
          <CardDescription>
            XYMの受け取りに使用するSymbolブロックチェーンのアドレスです
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateWalletAddress} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="walletAddress">XYM受取用アドレス</Label>
              <Input
                id="walletAddress"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="例: NCGGLVO-TMKGCN-NBND2F-RDOFRF-3QFPSG-BAGIPH-NPZ"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                投げ銭や記事購入の収益を受け取るために必要です。記事投稿で収益を得るには設定してください。
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={
                  saveLoading || walletAddress === originalWalletAddress
                }
              >
                {saveLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    更新中...
                  </>
                ) : (
                  "アドレスを更新"
                )}
              </Button>

              {walletAddress && (
                <Button variant="outline" size="icon" asChild className="ml-2">
                  <Link
                    href={`https://symbol.blockchain-authn.app/accounts/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Symbolエクスプローラーで確認"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-4">
        <Button variant="outline" onClick={() => router.back()}>
          戻る
        </Button>
      </div>
    </div>
  );
}
