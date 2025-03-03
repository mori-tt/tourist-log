"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useArticles } from "@/context/ArticlesContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useTopics } from "@/context/TopicsContext";
import { useForm } from "react-hook-form";
import MarkdownWithZoomableImages from "@/components/MarkdownWithZoomableImages";
import { ArticleFormData } from "@/context/ArticlesContext";
import SafeImage from "@/components/SafeImage";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import WalletAddressAlert from "@/components/WalletAddressAlert";

export default function ArticleDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const articleId = Number(params.id);
  const { articles } = useArticles();
  const { topics } = useTopics();
  const { setValue } = useForm<ArticleFormData>();

  const [tipDialogOpen, setTipDialogOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState(1000);
  const [walletPrivateKey, setWalletPrivateKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [purchaseWalletPrivateKey, setPurchaseWalletPrivateKey] = useState("");
  const [isPurchaseSubmitting, setIsPurchaseSubmitting] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");

  const article = articles.find((a) => a.id === articleId);

  useEffect(() => {
    if (article) {
      setValue("title", article.title);
      setValue("content", article.content);
      setValue("topicId", article.topicId);
      setValue("xymPrice", article.xymPrice);
    }
  }, [article, setValue]);

  const handleTip = async () => {
    setTipDialogOpen(true);
  };

  const handleTipSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/transactions/tip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderWalletPrivateKey: walletPrivateKey,
          recipientAddress: article?.user?.walletAddress,
          tipAmount,
          topicId: article?.topicId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "投げ銭の送信に失敗しました");
      }

      // トランザクションの状態を確認
      const transactionHash = data.blockchain.transactionInfo.hash;
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!confirmed && attempts < maxAttempts) {
        const statusResponse = await fetch(
          `/api/transactions/status/${transactionHash}`
        );
        const statusData = await statusResponse.json();

        if (statusData.status === "confirmed") {
          confirmed = true;
          setSuccess("投げ銭が正常に送信されました！");
          setTipDialogOpen(false);
        } else if (statusData.status === "error") {
          throw new Error("トランザクションの確認中にエラーが発生しました");
        }

        if (!confirmed) {
          await new Promise((resolve) => setTimeout(resolve, 5000)); // 5秒待機
          attempts++;
        }
      }

      if (!confirmed) {
        setError(
          "トランザクションの確認がタイムアウトしました。Symbol Explorerで確認してください。"
        );
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("投げ銭の送信中にエラーが発生しました");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("本当にこの記事を削除しますか？")) {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("記事が削除されました");
        router.push("/articles");
      } else {
        alert("記事の削除に失敗しました");
      }
    }
  };

  // 記事購入ダイアログを開く
  const handlePurchase = () => {
    setPurchaseDialogOpen(true);
  };

  // 記事購入処理を実行
  const submitPurchase = async () => {
    if (!article || !session) return;

    try {
      setIsPurchaseSubmitting(true);
      setPurchaseError("");

      // 記事購入トランザクションの実行
      const response = await fetch("/api/transactions/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          advertiserWalletPrivateKey: purchaseWalletPrivateKey,
          articleId: article.id,
          purchaseAmount: article.xymPrice,
          advertiserId: session.user.id, // 購入者IDを送信
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setPurchaseDialogOpen(false);
        alert(
          "記事の購入が完了しました！トランザクションハッシュ: " +
            result.blockchain.transactionInfo.hash
        );
        // 購入成功後、ページをリロードして購入状態を反映させる
        router.refresh();
      } else {
        const errorData = await response.json();
        setPurchaseError(errorData.error || "記事購入処理に失敗しました。");
      }
    } catch (error) {
      console.error("記事購入処理エラー:", error);
      setPurchaseError("記事購入処理に失敗しました。");
    } finally {
      setIsPurchaseSubmitting(false);
    }
  };

  if (status === "loading") return <p>Loading...</p>;
  if (!session) {
    signIn();
    return null;
  }
  if (!article) return <p>記事が見つかりません。</p>;

  const isAdmin = session.user?.isAdmin;
  const isAdvertiser = session.user?.isAdvertiser;
  const isGeneral = !isAdmin && !isAdvertiser;
  const isAuthor = session.user.email === article.author;
  const isPurchaser = article.purchasedBy === session.user.id;

  const canTip =
    !isAuthor && (isGeneral || isAdvertiser) && !article.isPurchased;
  const canPurchase = isAdvertiser && !article.isPurchased;

  // 購入済み記事のアクセス制御
  const canViewPurchasedArticle = isAdmin || isAuthor || isPurchaser;
  if (article.isPurchased && !canViewPurchasedArticle) {
    return (
      <Card className="m-8 p-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold mb-4">
            アクセス制限
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>この記事は購入済みのため、閲覧権限がありません。</p>
          <p>記事を閲覧できるのは以下のユーザーのみです：</p>
          <ul className="list-disc ml-5 mt-2">
            <li>記事を投稿したユーザー</li>
            <li>記事を購入した広告主</li>
            <li>管理者</li>
          </ul>
        </CardContent>
      </Card>
    );
  }

  const topicTitle =
    article.topic?.title ||
    topics.find((t) => t.id === article.topicId)?.title ||
    "トピックなし";

  return (
    <>
      <div className="mx-auto max-w-4xl p-8">
        <WalletAddressAlert />

        <Card className="m-8 p-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold mb-4">
              {article.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>著者: {article.author}</p>
            <p>トピック: {topicTitle}</p>
            <div className="my-4">
              <MarkdownWithZoomableImages content={article.content} />
            </div>
            {article.images && article.images.length > 0 && (
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {article.images.map((img: { url: string }, index: number) => (
                  <div key={index} className="relative">
                    <SafeImage
                      src={img.url}
                      alt={`Article Image ${index}`}
                      fill
                      className="object-cover border rounded"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                更新日時: {article.updatedAt.split("T")[0]}
              </p>
              <p className="text-sm text-gray-500">作者: {article.author}</p>
              <p className="text-sm text-gray-500">
                買取金額: {article.xymPrice}XYM
              </p>
              {article.isPurchased && (
                <p className="text-sm font-semibold text-green-600 mt-1">
                  ※この記事は購入済みです
                </p>
              )}
            </div>

            <div className="mt-4 flex gap-4">
              {canTip && <Button onClick={handleTip}>投げ銭する</Button>}

              {canPurchase && (
                <Button onClick={handlePurchase} variant="secondary">
                  この記事を購入する（{article.xymPrice}XYM）
                </Button>
              )}
            </div>

            {isAuthor && !article.isPurchased && (
              <div className="mt-4 flex gap-4">
                <Link href={`/article/${article.id}/edit`}>
                  <Button>編集</Button>
                </Link>
                <Button variant="destructive" onClick={handleDelete}>
                  削除
                </Button>
              </div>
            )}
            <div className="mt-4">
              <Button onClick={() => router.back()} className="mt-4">
                戻る
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 投げ銭ダイアログ */}
        <Dialog open={tipDialogOpen} onOpenChange={setTipDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>投げ銭を送る</DialogTitle>
              <DialogDescription>
                {success && <p className="text-green-600">{success}</p>}
                {error && <p className="text-red-600">{error}</p>}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="tipAmount" className="text-right">
                  XYM
                </label>
                <Input
                  id="tipAmount"
                  type="number"
                  className="col-span-3"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(Number(e.target.value))}
                  min="100"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="privateKey" className="text-right">
                  秘密鍵
                </label>
                <Input
                  id="privateKey"
                  type="password"
                  className="col-span-3"
                  value={walletPrivateKey}
                  onChange={(e) => setWalletPrivateKey(e.target.value)}
                  placeholder="あなたのSymbolウォレットの秘密鍵"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setTipDialogOpen(false)}>
                キャンセル
              </Button>
              <Button
                type="submit"
                onClick={handleTipSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "処理中..." : "送信"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 記事購入ダイアログ */}
        <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>記事を購入する</DialogTitle>
              <DialogDescription>
                この記事を{article.xymPrice}
                XYMで購入します。秘密鍵を入力してください。
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="purchasePrivateKey" className="text-right">
                  秘密鍵
                </label>
                <Input
                  id="purchasePrivateKey"
                  type="password"
                  className="col-span-3"
                  value={purchaseWalletPrivateKey}
                  onChange={(e) => setPurchaseWalletPrivateKey(e.target.value)}
                  placeholder="あなたのSymbolウォレットの秘密鍵"
                />
              </div>
              {purchaseError && (
                <p className="text-sm text-red-500">{purchaseError}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPurchaseDialogOpen(false)}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                onClick={submitPurchase}
                disabled={isPurchaseSubmitting}
              >
                {isPurchaseSubmitting ? "処理中..." : "購入する"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
