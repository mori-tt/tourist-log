"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface WalletAddressAlertProps {
  className?: string;
}

export default function WalletAddressAlert({
  className = "mb-4",
}: WalletAddressAlertProps) {
  const { data: session } = useSession();
  const [hasWalletAddress, setHasWalletAddress] = useState<boolean | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkWalletAddress = async () => {
      if (!session?.user?.id) return;

      try {
        const res = await fetch(`/api/user/${session.user.id}`);
        if (res.ok) {
          const userData = await res.json();
          setHasWalletAddress(!!userData.walletAddress);
        }
      } catch (error) {
        console.error("Error checking wallet address:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.id) {
      checkWalletAddress();
    }
  }, [session]);

  // 管理者の場合、またはウォレットアドレスが設定されている場合、または読み込み中の場合は何も表示しない
  if (
    session?.user?.isAdmin ||
    hasWalletAddress ||
    hasWalletAddress === null ||
    isLoading
  ) {
    return null;
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Symbolアドレスが設定されていません</AlertTitle>
      <AlertDescription>
        Symbolアドレスを設定しないと、投げ銭の受け取りや記事購入、広告費の支払いができません。
        <div className="mt-2">
          <Link href="/profile/settings">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Symbolアドレスを登録・更新する
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}
